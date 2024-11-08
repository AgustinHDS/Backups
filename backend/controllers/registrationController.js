import connection from "../dbConnection/database.js";
import { validationResult, matchedData } from "express-validator";
import handleHttpError from "../utils/handleError.js";
import { encrypt } from "../utils/handlePassword.js";

//localhost:3001/registration
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());

      return res.status(400).json({ errors: errors.array() });
    }
    const data = matchedData(req);
    const password = await encrypt(data.password);
    const body = { ...data, password }; //replaces or adds password property and its value(hash) to the object

    connection.query(
      "SELECT namedb, emaildb FROM users WHERE (namedb = ? OR emaildb = ?)",
      [body.user, body.email],
      (error, results) => {
        if (error) {
          console.error(error);

          return res.status(500).json({message: "Internal Server Error"});
        } else if (results.length > 0) {
          let existingName = results.some((item) => item.namedb === body.user);
          let existingEmail = results.some(
            (item) => item.emaildb === body.email
          );

          if (existingName && existingEmail) {
            console.log(
              `The email ${body.email} and user ${body.user} are taken`
            );

            return res.status(409).json({
              message: `The email ${body.email} and user ${body.user} are taken`
            })
          }
          if (existingName) {
            console.log(`The user ${body.user} already exists`);

            return res.status(409).json({
              message: `The user ${body.user} already exists`
            })
          } else if (existingEmail) {
            console.log(`The email ${body.email} already exists`);

            return res.status(409).json({
              message: `The email ${body.email} already exists`
            })
          }
        } else {
          connection.query(
            "INSERT INTO users (namedb, emaildb, passdb, role) VALUES (?, ?, ?, ?)",
            [body.user, body.email, body.password, "user"],
            async (error) => {
              if (error) {
                console.error(
                  `Error while inserting values in database, ${error}`
                );

                return res.status(500).json({message: "Internal Server Error"});
              } else {
                console.log("Data saved successfully", {
                  name: body.user,
                  pass: body.pass
                });
                //we don't want to send the password as a response
                delete body.password;

                return res.status(200).json({ body });
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    handleHttpError(res, "Error trying to sign up");
  }
};

export default register;
