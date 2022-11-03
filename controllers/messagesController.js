const messageModel = require("../model/messageModel");
const request = require("request-promise");
module.exports.addMessage = async (req, res, next) => {
    try {
        const {from, to, message} = req.body;
        const data = await messageModel.create({
            message: {text: message},
            users: [from, to],
            sender: from,
        });
        if (data) return res.json({ msg: "Message added successfully." });
        return res.json({ msg: "Failed to add message to the database."})
    } catch (e) {
        next(ex);
    }
};
function options (jsonBody, uri) {
    return ({
        method: 'POST',
        uri: `http://5baf-180-243-12-177.ngrok.io/${uri}`, // Change this to the tunnel
        body: jsonBody,
        json: true,
    })
}

function formatBotMessage (jsonMsg) {
    console.log(jsonMsg)
    const trackKeys = Object.keys(jsonMsg['track_id'])
    const arrayLen = trackKeys.length
    var messageReturn = "Did you search for these songs?\n"
    for (let i = 0; i < arrayLen; i++) {
        if (i === 4) break;
        var trackId = trackKeys[i]
        const songName = jsonMsg['track_name'][trackId]
        const songArtist = jsonMsg['track_artist'][trackId]
        const genre = jsonMsg['playlist_genre'][trackId]
        const lyrics = jsonMsg['lyrics'][trackId]
        let lyricSample = ""
        var arrLyrics = lyrics.split(" ")
        for (let j = 0; j <= 9; j++) {
            if (j != 9) {
                lyricSample = lyricSample.concat(`${arrLyrics[j]} `)
            } else {
                lyricSample = lyricSample.concat(`${arrLyrics[j]}...`)
            }
        }
        const songEntry = `${i+1}. title: ${songName}, artist: ${songArtist}, genre: ${genre}\nsample lyrics: \"${lyricSample}\"\n`
        messageReturn = messageReturn.concat(songEntry)
    }
    return messageReturn
}

async function getBotAnswer(message) {
    try {
        var userPrompt = message.split(";")
        var ansMsg = 
        `Hey this is songbot!!\n
        I can search songs from around 10000+ english Spotify songs dated 2020 and earlier\n
        to conjure commands you may refer to this template [title/artist/lyrics/artist-title/title-lyrics/artist-lyrics];[corresponding search];[corresponding search]\n
        e.g. \ntitle;One Step Closer \nartist-lyrics;Linkin Park;I tried so hard and got so far\n
        Do note that the order of the command matters`
        if (userPrompt.length == 2) {
            var uriBody = userPrompt[0]
            var jsonDict = {}
            jsonDict[userPrompt[0]] = userPrompt[1] 
        } else if (userPrompt.length == 3) {
            var uriBody = userPrompt[0]
            var uriSplit = uriBody.split('-')
            if (uriSplit.length == 1) throw "wrong template"
            var jsonDict = {}
            jsonDict[uriSplit[0]] = userPrompt[1]
            jsonDict[uriSplit[1]] = userPrompt[2]
        } else {
            return ansMsg
        }
        
        const sendRequest = await request(options(jsonDict, uriBody))
        var response = JSON.parse(sendRequest)   
        var returnMsg = formatBotMessage(response)
        return returnMsg
    } catch (e) {
        console.log(e)
        return "Something went wrong please try again!"
    }
}

module.exports.autoReplyMessage = async (req, res, next) => {
    try {
        const {from, to, message} = req.body;
        
        const data = await messageModel.create({
            message: {text: message},
            users: [from, to],
            sender: from,
        })
        const getBotMessage = await getBotAnswer(message)
        const dataCallBack = await messageModel.create({
            message: {text: getBotMessage},
            users: [to, from],
            sender: to, 
        })

        if (data && dataCallBack) {
            return res.json({ msg_status: "Message added succesfully.", msg_return: getBotMessage})
        }
        return res.json({ msg: "Failed to add message to the database.", msg_return: "Failed"})
    } catch (e) {
        console.log(e)
        next(next);
    }
}

module.exports.getAllMessage = async (req, res, next) => {
    try {
        const {from, to} = req.body;
        const messages = await messageModel.find({
            users: {
                $all: [from, to],
            },
        })
        .sort({ updatedAt: 1})
        const projectedMessages = messages.map((msg) => {
            return {
                fromSelf: msg.sender.toString() === from,
                message: msg.message.text,
            }
        })
        res.json(projectedMessages)
    } catch (e) {
        next(ex);
    }
};


