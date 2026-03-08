import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WA_URL = process.env.WA_URL;
const WA_USER = process.env.WA_USER;
const WA_PASSWORD = process.env.WA_PASSWORD;
const DEVICE_ID = process.env.WA_DEVICE_ID;

const auth = Buffer.from(`${WA_USER}:${WA_PASSWORD}`).toString("base64");

export async function getChats(){
    const res = await axios.get(`${WA_URL}/chats`, {
        headers: {
            Authorization: `Basic ${auth}`,
            "X-Device-Id": DEVICE_ID
        }
    })

    return res.data
}