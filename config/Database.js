import { connect } from "mongoose";

const connection = async () => {
  const { connection } = await connect(process.env.MONGO_URI);
  console.log(`MongoDB connected with ${connection.host}`);
};

export default connection;
