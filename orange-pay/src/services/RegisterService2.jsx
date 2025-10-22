import axios from "axios";

const base_url = "http://localhost/8081/api/v1/auth"


export const registerNewUser = async (phoneNumber) => {

  try {
    const response = await axios.post(
        `${base_url}/request`,
        {phoneNumber}
    );

    console.log(response);
    return response.data;
  } catch (error) {
    throw error;
  }
}