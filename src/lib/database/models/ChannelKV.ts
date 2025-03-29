import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ChannelKVSchema = new Schema({
  authorId: {
    type: String,
    required: true,
    index: true,
  },
  channelId: {
    type: String,
    required: true,
    index: true,
  },
});

const ChannelKV = mongoose.model("ChannelKV", ChannelKVSchema);

export default ChannelKV;
