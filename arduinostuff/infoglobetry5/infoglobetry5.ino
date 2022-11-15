// Current iteration started 8/8
/* retrieves time and date and messages on timer, alternating between the two. Always scrolls, transition random.
 *  Rounds of len 4, showing messages then date or time.
 */

 #include <WiFiManager.h> // https://github.com/tzapu/WiFiManager

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <Arduino.h>

#include <TimeLib.h>

// Define macros for input and output pin etc.
#include "PinDefinitionsAndMore.h"

//#define SEND_PWM_BY_TIMER
//#define USE_NO_SEND_PWM
//#include <IRremote.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>


#define numSignals 1

uint16_t zeroTime = 988;
int oneTime = 1000;
uint16_t IRSIGS[numSignals][2] = { // Signal on means zero to the spinning arm. 
    {zeroTime,0}
};

int curSig = 0;

// BOOYAH - inital message
// size 320 is biggest a message can be, I think. 2 byte header + 35 char + 1 byte transition = 38*8 bits = 304, and I left some room in case I'm wrong. 
bool sig[320] = {0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,1,1,1,1,0,1,0,0,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0,1,1,0,0,1};
bool sig2[320] = {0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,1,1,1,1,0,1,0,0,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0,1,1,0,0,1};
long msgLen = 96;


const uint16_t kIrLed = 4;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).
IRsend irsend(kIrLed);  // Set the GPIO to be used to sending the message.

char infoglobeMsg[35];
long locTime;

const int numMsgs = 6;
int curMsgIndex = 0;
String msgs[numMsgs] = {
    "8v)", // index 0 is for time
    "Gamma",
    ":D",
    "Mom!", // index 3 is for date
    "Yee",
    ":3"
};

long lastDatetimeUpdate = 0;
long lastDisplayUpdate = 0;

long displayWait = 15000;
long datetimeWait = displayWait*numMsgs + 100; // wait until all messages are updated to refresh
bool written = false;



int effects[] = {0,2,  3,4,7,8,  9,10,11,  12,  16,17,18,19,  21, 24, 25, 26,28,  30,33, 34};
int numEffects = sizeof(effects)/sizeof(effects[0]);


void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    Serial.begin(115200);

    irsend.begin();

    Serial.print(F("Ready to send IR signals at pin "));
    Serial.println(kIrLed);

    locTime = getLocalTime(); // get initial time
    unix2time(locTime);
    
    lastDatetimeUpdate = millis();
    lastDisplayUpdate = millis();

} 


void loop() {
    digitalWrite(LED_BUILTIN, LOW); // ESP8266 Wemos D1 Mini LED is inverted -.-

    // Manually adding a new message through Serial
    if (Serial.available() > 0){
        // Read in new message
        String newSigS = Serial.readString();
        //////// Read in string from Serial to write onto the infoglobe
        infoAddMsg(newSigS);
        Serial.print("New message: ");
        Serial.println(newSigS);
        written = false;
    }



    ////////////////// Retrieve messages from aksuper7 site
    if (millis()-lastDatetimeUpdate > datetimeWait){
        locTime = getLocalTime();
        if (locTime > 0){
            unix2time(locTime);
        }
        
        lastDatetimeUpdate = millis();
        lastDisplayUpdate = millis();
        written = false;
        curMsgIndex = 0;
        
    } else if (millis() - lastDisplayUpdate > displayWait){ // Load next message, update time and date string
        infoAddMsg(msgs[curMsgIndex]);
        
        curMsgIndex += 1;
        curMsgIndex %= numMsgs;
    
        lastDisplayUpdate = millis();
        written = false;
    }


    ///////////////// Relay message over Infrared to the spinning arm
    if (!written){
        msgLen = msg2bool((bool*)&sig, infoglobeMsg, effects[random(numEffects)]);
        sendSig();
        written = true;
        Serial.println("Written");
    }

    
    Serial.println("Loop");
    digitalWrite(LED_BUILTIN, HIGH);
    delay(7400);
} 


void sendSig(){
    // Send it
    Serial.println("Sending Sig");
    Serial.println(msgLen);
    for (int i = 0; i < msgLen; i++){
        if (sig[i] == 0){ // Send 1 ms of signal
            irsend.sendRaw(IRSIGS[curSig], sizeof(IRSIGS[curSig])/sizeof(IRSIGS[curSig][0]), 38);
        } else{
            delayMicroseconds(oneTime);
        }
    }
    Serial.println("Done Sending Sig");   
}

///////////////////////// Makes an API call to worldtimeapi and gets the timezone localized unixtime
///////////////////////// This can then be converting using the TimeLib Library
const char* ssid = "WOKO_Bahnhalde";
const char* password = "";

long getLocalTime(){
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http; //Object of class HTTPClient
        WiFiClient client;

//        http.begin(client, "http://worldtimeapi.org/api/ip");
        http.begin(client, "http://aksuper7.pythonanywhere.com/json");
        int httpCode = http.GET();
        long unixTime, tmp;
        if (httpCode > 0)  {
            const size_t bufferSize = JSON_OBJECT_SIZE(30);
            DynamicJsonDocument jsonBuffer(bufferSize);
            deserializeJson(jsonBuffer, http.getString());
            Serial.println(http.getString());

            unixTime = jsonBuffer["timestamp"]; 

            // Parse the rest of the messages, minus 2 for the date and time
            int msgInsertInd = 0;
            for (int i = 0; i < (numMsgs-2); i++){
                if (i == 0 || i == 3){
                    msgInsertInd++;
                }
                String tmpStr = (String)jsonBuffer[String("msg") + i];
                if (tmpStr == "" || tmpStr == NULL || tmpStr == "null") { // placeholder if there's not enough messages
                    msgs[msgInsertInd] = "Howdy!";
                    Serial.println("placeholder'd");
                } else{
                    msgs[msgInsertInd] = tmpStr;
                    Serial.println(msgs[msgInsertInd]);
                    // {"msg0": "and so what", "msg1": "what of it", "msg2": "whoare you"}
                }
                msgInsertInd++; // update index for next message
            }
        }
        http.end(); //Close connection, we've got the data
        return unixTime;
    } else { // Connect to WiFi
        WiFi.begin(ssid, password);
        long beginTime = millis();
        
        while (WiFi.status() != WL_CONNECTED) {
            if ((millis()-beginTime) > 10000){ // Resort to launching AP if connection takes too long >10s
                Serial.println("No WiFi Found :(");
                infoAddMsg("WiFi AP: Infoglobe, pw:password");

                int success = launchWiFiAP();
                if (success == 0){
                    Serial.println("Access Point WiFi Found :)");
                    continue;
                } else{
                    Serial.println("Access Point WiFi also not found :(");
                    infoAddMsg("No WiFi found :(");
                    return -1;
                }
            }
            delay(1000);
            Serial.println("Connecting...");
        }
        Serial.println("Connected!");
        return getLocalTime();
    }
}






int launchWiFiAP(){
  //WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
  WiFiManager wm;

  // reset settings - wipe stored credentials for testing
  // these are stored by the esp library
//  wm.resetSettings();

  // Automatically connect using saved credentials,
  // if connection fails, it starts an access point with the specified name ( "AutoConnectAP"),
  // if empty will auto generate SSID, if password is blank it will be anonymous AP (wm.autoConnect())
  // then goes into a blocking loop awaiting configuration and will return success result

  bool res;
  // res = wm.autoConnect(); // auto generated AP name from chipid
  // res = wm.autoConnect("AutoConnectAP"); // anonymous ap
  res = wm.autoConnect("Olympia Infoglobe Brain", "password"); // password protected ap

  if (!res) {
    Serial.println("Failed to connect");
    return 1;
//    ESP.restart();
  }
  else {
    //if you get here you have connected to the WiFi
    Serial.println("connected...yeey :)");
    return 0;
  }
}


// Add arbitrary message to infoglobeMsg
void infoAddMsg(String customMsg){
    snprintf(infoglobeMsg, 35, customMsg.c_str());
}



char strBuffer[35];

// unix2date(locTime + (millis()-lastDatetimeUpdate)/1000);
void unix2date(long unixTime){
    snprintf(strBuffer, 35, "%s %02d, %4d", monthStr(month(unixTime)), day(unixTime), year(unixTime));
    msgs[3] = String(strBuffer);
}

// unix2time(locTime + (millis()-lastDatetimeUpdate)/1000);
void unix2time(long unixTime){
    snprintf(strBuffer, 35, "%02d:%02d %s", hour(unixTime) % 12, minute(unixTime), (hour(unixTime) > 12) ? "pm" : "am" );
    msgs[0] = String(strBuffer);
}

void unix2datetime(long unixTime){
    snprintf(infoglobeMsg, 35, "%s %02d, %4d   %02d:%02d %s", monthShortStr(month(unixTime) ), day(unixTime), year(unixTime), hour(unixTime) % 12, minute(unixTime), (hour(unixTime) > 12) ? "pm" : "am" );
}

// 0,2,3,4, 

// same as 1, CCW
// 1 msg flies in CW, erases old

// 2 message flies in like a pincer, 2 sided

// 3 each pixel fades and then fades back in

// 4 same as 5 but CW
// 5 new fills in by erasing stationary old CCW
// 7 old leaves in CCW, new forms stationary underneath
// 8 grow down by row, grow up

// 9 shrink to center, then expand from center
// 10 interesting fill in, alternating from the top. 
// 11 phase out each letter from the center, phase in from outside.

// 12 replace all letters in circle, CCW
// 13 same as 12, CW

// 14 replaced in circle, every other letter, CCW

// 16 old down, new up
// 17 old up, new donw
// 18 Everyone replaced at once by dropping, new letters come from above
// 19 everyone replaced at once by flying up, new from below

// 21 Erases in loop, then places back

// 24 comes from bottom and mirrors
// 25 comes from top and mirrors


// 26 drop and replace, from L to R
// 28 drop and replace, random
// 30 pluck and replace, in order left to right
// 33 pluck and replace, random
// 34 each letter fade out from right
// 35-37 all variations on 34


//chosen effects = {0,2,  3,4,7,8,  9,10,11,  12,  16,17,18,19,  21, 24, 25, 26,28,  30,33, 34}


/*  
 *   Inputs:
 *      buf: pointer to bool array that msg gets written into
 *      msg: message to display 
 *      effect: 0-37 inclusive, dictates the transition. 
 *           Also includes static display (38), flashing display (39), and others etc.
 *      
 *  Returns:
 *      Length of message + effect in bools.
*/  
int msg2bool(bool* buf, String msg, int effect){
    byte effectBytes = byte(effect);
    int len = msg.length();
//    int firstMsgByte; // = (effect <= 37 && effect >= 0) ? 2 : 1;
    int numBits = 0;

    bool transitionOn = (effect <= 37 && effect >= 0);

    /////////////// Header
    // first 2 bytes are zero if transitions are on, otherwise depends (0x04 for now)
    if (transitionOn){ // first 16 bits are all 0
        for (int i = 0; i<16; i++){ 
            buf[numBits] = 0;
            numBits += 1;
        }
    } else if (effect == -6){  // Toggles scrolling
        for (int i = 0; i<8; i++){ 
            buf[numBits] = bitRead(6, 7-i);
            numBits += 1;
        }
        return numBits;
    } else { // first 8 bits are from 0x04
        for (int i = 0; i<8; i++){ 
            buf[numBits] = bitRead(4, 7-i);
            numBits += 1;
        }
    }


        
    ////////////////// Add msg
    byte curChar;
    for (int i = 0; i < len; i++){ // i=firstMsgBit to skip the header's bytes
        curChar = byte(msg[i]);
        for (int j = 0; j < 8; j++){
            buf[numBits] = bitRead(curChar, 7-j);
            numBits += 1;
        }
    }


    /////////// Add transition number to end if valid
    if (transitionOn){
        for (int j = 0; j < 8; j++){
            buf[numBits] = bitRead(effectBytes, 7-j);
            numBits += 1;
        }
    } 

    
//    // For flashing a scrolling message (02h)
//    if (effect > 50){
//        for (int i = 0; i<8; i++){ 
//            buf[numBits] = bitRead(2, 7-i);
//            numBits += 1;
//        }
//    }
//
//    // for 02h
//    if (effect > 50){
//        for (int i = 0; i<8; i++){ 
//            buf[numBits] = bitRead(4, 7-i);
//            numBits += 1;
//        }
//    }

    
    
//    else{ // for flashing 05h
//        for (int j = 0; j < 8; j++){
//            buf[numBits] = bitRead(0, 7-j);
//            numBits += 1;
//        }
//        for (int j = 0; j < 8; j++){
//            buf[numBits] = bitRead(2, 7-j);
//            numBits += 1;
//        }
//        for (int j = 0; j < 8; j++){
//            buf[numBits] = bitRead(msg.length(), 7-j);
//            numBits += 1;
//        }
//    }
    
    return numBits;
}
