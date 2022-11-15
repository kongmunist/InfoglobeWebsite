// Andy Kong 11/13/22
//    Code to control the Olympia Infoglobe message and transitions

// USAGE: 
//    Type a message > 2 chars into Serial and this script will try to write it out into the Infoglobe's IR LED attached to Pin D2
//    To send a String X to the Infoglobe, call infoAddMsg(X);

// Hardware setup can be found here:
// https://andykong.org/blog/infoglobetutorial1/
// https://andykong.org/blog/infoglobetutorial2/


#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

/////////////////////////// YOU WILL HAVE TO TUNE THIS NUMBER //////////////////////////
// These variables abuse the IRremote library to send out 1ms of 38kHz-modulated light, which 
// the infoglobe interprets as a "1" bit. delayMicroseconds is then used for the "0" bit. 
uint16_t gapTime = 988;
uint16_t IR1Bit[2] = {gapTime, 0};
// Microcontroller clocks and timing interrupts aren't perfect, so saying "delayMicroseconds(1000)" doesn't always
// give you 1000us. From my experience, the drift can be up to ~15us, and the infoglobe only works within an error range of ~3us.
// These are my ESP's timing numbers, if you upload this code and your infoglobe is blank, you should delete them and find your own.

// If you have an oscilloscope, you can calculate this number. Otherwise, start exploring around 1000 in increments of 5,
// and once you see garbled text you'll know you're closer. Then you can drop to 3, 2, or 1us increments.
// If this doesn't work, feel free to contact me
////////////////////////////////////////////////////////////////////////////////////////



// Setting up the IR library
const uint16_t kIrLed = 4;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).
IRsend irsend(kIrLed);  // Set the GPIO to be used to sending the message.


// bool array holding message in bits, right before sending
// size 320 is biggest a message can be, I think. 2 byte header + 35 char + 1 byte transition = 38*8 bits = 304, and I left some room in case I'm wrong. 
bool sig[320] = {0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,1,1,1,1,0,1,0,0,1,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0,1,1,0,0,1};


// Message delivery status and message-carrying arrays
bool written = false;
int msgLen = 0;
char infoglobeMsg[35];
String mainMessage = "Hello World"; // Default message text
String incomingSig = mainMessage; // Stores the serial-input message


// This is removable, I just want the message to rewrite and jumpy so i can see it's still running
long lastWrite = 0; 

void setup() {
    // Initialize Serial
    pinMode(LED_BUILTIN, OUTPUT);
    Serial.begin(115200);

    // Initialize the IR library
    irsend.begin();
    Serial.print(F("Ready to send IR signals at pin "));
    Serial.println(kIrLed);

    // Load in the first message
    infoAddMsg(mainMessage); 
} 


void loop() {
    // If available, read in Serial message to write to the infoglobe
    if (Serial.available() > 0){
        incomingSig = Serial.readString();
        
        // If the serial command is too short, we clear the infoglobe with the original message ("BOOYAH") 
        if (incomingSig.length() <= 2){
            infoAddMsg(mainMessage);
        } 
        else {  // Otherwise, we read in the new message
            infoAddMsg(incomingSig);
            Serial.println("New message ");
            Serial.println(incomingSig);
        }
    }

    ////////////////////// Removable stuff
    if (millis() - lastWrite > 15000){ // Make message rewrite and jump so we can see it's still going
        infoAddMsg(incomingSig);
        lastWrite = millis();
    }
    
    // Prevent our loop from going too quick, reduces power usage
    delay(50); 
} 



// Queues a customMsg to be converted to bits and sent to the infoglobe
void infoAddMsg(String customMsg){
    snprintf(infoglobeMsg, 35, customMsg.c_str());
    written = false;
    sendSig();
}



// This function writes the global bool[] "sig" to the infoglobe by modulating the hijacked IR LED
void sendSig(){
    // We can pick a transition effect from 0-37, so the new message comes in an interesting way
//    long transitionEffect = random(38);
    // or we pick only scrolling, immediate update. This is less buggy when first figuring out timings
    long transitionEffect = -1;
    
    // First, message is turned from a String into "msgLen"-number of bools 
    // and written into the "sig" message holder
    msgLen = msg2bool((bool*)&sig, infoglobeMsg, transitionEffect); // Last element here is the transition effect number

    // Loop goes over the sig array and sends off each bit of our message
    for (int i = 0; i < msgLen; i++){
        if (sig[i] == 0){ 
            irsend.sendRaw(IR1Bit, 2, 38); // Send 1 ms of signal '1' (not switched, 0 bit is a '1' sent)
        } else{
            delayMicroseconds(gapTime); // Send 1ms of signal '0'
        }
    }
    written = true;
    Serial.println("Written");
}


/*  msg2bool loads a message into a bool buffer to be read off to the infoglobe. 
 *   Inputs:
 *      buf: pointer to bool array that msg gets written into
 *      msg: message to display 
 *      effect: 0-37 inclusive, dictates the transition. 
 *           Also includes static display (38), flashing display (39), and others etc. 
 *           Put -1 for immediate upload of scrolling message
 *           Inputs besides -1 to 37 may not work properly!
 *      
 *  Returns:
 *      Length of (message + effect) in bools.
*/  
int msg2bool(bool* buf, String msg, int effect){
    byte effectBytes = byte(effect);
    int len = msg.length();
    int numBits = 0;

    // Only valid transition effects are 0-37, but there are other inputs for effect that 
    bool transitionOn = (effect <= 37 && effect >= 0);

    /////////////// Header
    // first 2 bytes are zero if transitions are on, otherwise depends (0x04 for now)
    if (transitionOn){ // first 16 bits are all 0
        for (int i = 0; i<16; i++){ 
            buf[numBits] = 0;
            numBits += 1;
        }
    } else if (effect == -6){  // Toggles scrolling, 0x06
        for (int i = 0; i<8; i++){ 
            buf[numBits] = bitRead(6, 7-i);
            numBits += 1;
        }
        return numBits;
    } else { // first 8 bits are 0x04: Loads the message for immediate scrolling display. Blanks the display if sent alone.
        for (int i = 0; i<8; i++){ 
            buf[numBits] = bitRead(4, 7-i);
            numBits += 1;
        }
    }
    
        
    ////////////////// Add msg bits
    byte curChar;
    for (int i = 0; i < len; i++){ 
        curChar = byte(msg[i]);
        for (int j = 0; j < 8; j++){
            buf[numBits] = bitRead(curChar, 7-j);
            numBits += 1;
        }
    }


    /////////// Add transition number to end if we're doing transitions
    if (transitionOn){
        for (int j = 0; j < 8; j++){
            buf[numBits] = bitRead(effectBytes, 7-j);
            numBits += 1;
        }
    } 
    
    return numBits;
}
