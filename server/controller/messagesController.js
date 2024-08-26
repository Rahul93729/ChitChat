const Messages = require("../model/messageModel");
const User = require("../model/userModel");
const Chat = require("../model/chatModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Messages.find({ chat: req.params.chatId })
      .populate("sender", "username profilePic email")
      .populate({ path: "chat", populate: { path: 'latestMessage', populate: { path: 'sender' } } });
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { sender, chatId, content } = req.body;
    const attachmentUrl = req.file ? req.file.filename : "";

    if (!chatId || !sender) {
      console.log("Invalid data passed into request");
      return res
        .status(400)
        .json({ message: "ChatId and sender are required" });
    }

    const newMessage = {
      sender: sender,
      content: content,
      chat: chatId,
      attachment: attachmentUrl,
    };

    let message = await Messages.create(newMessage);

    await Chat.findByIdAndUpdate(
      chatId,
      { latestMessage: message },
      { new: true }
    );

    message = await message.populate("sender", "username profilePic");
    message = await User.populate(message, {
      path: "chat.users",
      select: "username profilePic",
    });
    message = await message.populate({
      path: "chat",
      populate: { path: "latestMessage", populate: { path: "sender" } },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error in addMessage:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};