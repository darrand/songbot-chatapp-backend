const { addMessage, getAllMessage, autoReplyMessage } = require("../controllers/messagesController")

const router = require("express").Router()

router.post("/addmsg/", addMessage)
router.post("/getmsg/", getAllMessage)
router.post("/botmsg/", autoReplyMessage)

module.exports = router;