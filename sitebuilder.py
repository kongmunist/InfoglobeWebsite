from flask import Flask, render_template, request, jsonify, url_for, redirect, send_from_directory
# from flask_flatpages import FlatPages
# from flask_frozen import Freezer
import os, sys
import json
from datetime import datetime

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
# app.config['DEBUG'] = True
MSG_LIMIT = 3
MAX_LENGTH = 38
# freezer = Freezer(app)


# TODO:
# no repeats
# no empty
# delete button per message
# fun infoglobe visualizer that spins


@app.route('/savemessage', methods = ['POST'])
def save_msg():
    data = []
    if request.method == 'POST':
        try:
            with open('static/messages.txt', 'r') as f:
                data = f.read().strip().split('\n')
        except:
            pass

        with open('static/messages.txt', 'w') as f:
            msg = request.get_json()
            msg = msg[:MAX_LENGTH]
            if (msg not in data):
                data.insert(0, msg)

            data = data[:3]
            f.write("\n".join(data))

        with open('static/messages.json', "w+") as f:
            d = dict()
            for i,msg in enumerate(data):
                d["msg" + str(i)] = msg
            f.write(json.dumps(d))


        # Add to permanent log:
        # datetime object containing current date and time + message
        now = datetime.now()
        # dd/mm/YY H:M:S
        dt_string = now.strftime("%d/%m/%Y %H:%M:%S")
        with open('static/log.txt', "a") as f:
            f.write(dt_string + ": " + request.get_json() + "\n")

    return jsonify(data)



@app.route('/', methods = ['GET'])
def index():
    data = []
    if (request.method == "GET"):
        try:
            with open('static/messages.txt', 'r') as f:
                data = f.read().strip().split('\n')
        except:
            pass
    return render_template("form.html", values=data)


# /json delivers the .json file to the globe (or malicious actor) after updating the time
@app.route('/json')
def jsonFile():
    # Update the timestamp to the current time
    with open('static/messages.json', "r+") as f:
        d = json.loads(f.read())
        curTime = datetime.now().timestamp()
        curTime = int(curTime) + readTimeoffset()
        d.update({"timestamp": curTime})
        f.truncate(0) # both needed
        f.seek(0)
        f.write(json.dumps(d))

    # Update lastLogged.txt
    with open('static/lastLogged.txt', "w+") as f:
        f.write(str(int(datetime.now().timestamp())))
    return send_from_directory("static", 'messages.json')

# datetime sets the time offset string to Andy's browser. This adjusts the time set in /json
@app.route('/settime')
def setTime():
    minuteOffset = request.args.get('offset')
    if minuteOffset:
        with open('static/timeOffset.txt', "w+") as f:
            f.write(minuteOffset*60)
        return jsonify({"minuteOffset": minuteOffset})

    return render_template("timepage.html")


def readTimeoffset():
    try:
        with open('static/timeOffset.txt', "r") as f:
            return int(f.read())
    except:
        return 0

@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response



if __name__ == "__main__":
    app.run(port=8000, debug=True)
