
import axios from "axios";

const postData = async (winner: string, data: { NS: number; EW: number; emergencyNS: boolean; emergencyEW: boolean }) => {
  try {
    const response = await axios.post("https://amankumar23.app.n8n.cloud/webhook/7d792364-3704-4413-b951-c8d5b7e14a10", {
      winner,
      NS: data.NS,
      EW: data.EW,
      emergencyNS: data.emergencyNS,
      emergencyEW: data.emergencyEW
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data:");
    
  }
};

export default postData;