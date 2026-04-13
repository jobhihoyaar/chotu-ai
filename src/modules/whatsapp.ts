import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WA_URL = process.env.WA_URL;
const WA_USER = process.env.WA_USER;
const WA_PASSWORD = process.env.WA_PASSWORD;
const DEVICE_ID = process.env.WA_DEVICE_ID;

function getHeaders() {
    const auth = Buffer.from(`${WA_USER}:${WA_PASSWORD}`).toString("base64");

    return {
        Authorization: `Basic ${auth}`,
        "X-Device-Id": DEVICE_ID,
    };
}

export async function getChats() {
    const res = await axios.get(`${WA_URL}/chats`, {
        headers: getHeaders(),
    });

    return res.data;
}

export async function sendMessageToWhatsapp(phoneNumber: string, text: string) {
    const res = await axios.post(
        `${WA_URL}/send/message`,
        {
            phone: phoneNumber,
            message: text,
            is_forwarded: false,
        },
        {
            headers: getHeaders(),
        },
    );

    return res.data;
}