import axios from "axios";

const NGROK_URL = "https://involucral-protectively-preston.ngrok-free.dev";

export async function pressSpaceBar() {
  try {
    const response = await axios.get(`${NGROK_URL}/press-space`);
    console.log("Spacebar was pressed")
    return response.data;
  } catch (error) {
    console.error("RobotJS Error:", error);
    return { status: "error", message: "Failed to press spacebar" };
  }
}

export async function addToCalendar(){
  console.log("Adding to calendar")
}