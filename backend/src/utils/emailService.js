import nodemailer from "nodemailer";
import { emailConfig } from "../config/emailConfig.js";

// Simple email service using Gmail SMTP (free)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com", //service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });
};

export const sendSwapRequestNotification = async (
  toEmail,
  requesterName,
  targetFacultyName,
  swapDetails
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: emailConfig.user,
      to: toEmail,
      subject: `Class Swap Request from ${requesterName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #a2ccf0, #cce4ff); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #0895c0; margin: 0;">Class Swap Request</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #0895c0; margin-top: 0;">Request Details</h3>
            <p><strong>From:</strong> ${requesterName}</p>
            <p><strong>To:</strong> ${targetFacultyName}</p>
            <p><strong>Swap Date:</strong> ${new Date(
              swapDetails.swapDate
            ).toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${swapDetails.reason}</p>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="color: #0895c0; margin-top: 0;">Class Details</h4>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 200px; margin: 10px;">
                <h5 style="color: #28a9dc; margin-bottom: 10px;">Your Class</h5>
                <p><strong>Day:</strong> ${swapDetails.requesterClass.day}</p>
                <p><strong>Period:</strong> ${
                  swapDetails.requesterClass.periods[0]
                }</p>
                <p><strong>Subject:</strong> ${
                  swapDetails.requesterClass.subject
                }</p>
                <p><strong>Room:</strong> ${swapDetails.requesterClass.room}</p>
              </div>
              <div style="flex: 1; min-width: 200px; margin: 10px;">
                <h5 style="color: #e17055; margin-bottom: 10px;">Requested Class</h5>
                <p><strong>Day:</strong> ${swapDetails.targetClass.day}</p>
                <p><strong>Period:</strong> ${
                  swapDetails.targetClass.periods[0]
                }</p>
                <p><strong>Subject:</strong> ${
                  swapDetails.targetClass.subject
                }</p>
                <p><strong>Room:</strong> ${swapDetails.targetClass.room}</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${emailConfig.frontendUrl}/requests" 
               style="background: linear-gradient(135deg, #28a9dc, #1c89b1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View & Respond to Request
            </a>
          </div>
          
          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>Note:</strong> Please respond to this request as soon as possible. 
              The requester will be notified of your decision.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Swap request notification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
};

export const sendSwapResponseNotification = async (
  toEmail,
  responderName,
  response,
  swapDetails
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: emailConfig.user,
      to: toEmail,
      subject: `Swap Request ${
        response === "accepted" ? "Accepted" : "Rejected"
      } by ${responderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${
            response === "accepted" ? "#a8e6cf, #7fcdcd" : "#fab1a0, #e17055"
          }); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: ${
              response === "accepted" ? "#00b894" : "#d63031"
            }; margin: 0;">
              Swap Request ${response === "accepted" ? "Accepted" : "Rejected"}
            </h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #0895c0; margin-top: 0;">Response Details</h3>
            <p><strong>Responded by:</strong> ${responderName}</p>
            <p><strong>Status:</strong> <span style="color: ${
              response === "accepted" ? "#00b894" : "#d63031"
            }; font-weight: bold;">
              ${response === "accepted" ? "ACCEPTED" : "REJECTED"}
            </span></p>
            <p><strong>Response Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${
              swapDetails.responseMessage
                ? `<p><strong>Message:</strong> ${swapDetails.responseMessage}</p>`
                : ""
            }
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${emailConfig.frontendUrl}/requests" 
               style="background: linear-gradient(135deg, #28a9dc, #1c89b1); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View All Requests
            </a>
          </div>
          
          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>Note:</strong> ${
                response === "accepted"
                  ? "The swap has been approved. Please coordinate with the other faculty member for the class exchange."
                  : "The swap request has been declined. You can create a new request if needed."
              }
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Swap response notification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
};

export const sendStudentNotification = async (
  studentEmails,
  swapDetails,
  action
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: emailConfig.user,
      to: studentEmails.join(", "),
      subject: `Class Schedule Update - ${
        action === "swap" ? "Class Swap" : "Schedule Change"
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #a2ccf0, #cce4ff); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #0895c0; margin: 0;">Class Schedule Update</h2>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #0895c0; margin-top: 0;">Important Notice</h3>
            <p>There has been a change in your class schedule due to a faculty class swap.</p>

            <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #0895c0; margin-top: 0;">Updated Schedule</h4>
              <p><strong>Date:</strong> ${new Date(
                swapDetails.swapDate
              ).toLocaleDateString()}</p>
              <p><strong>Class:</strong> ${swapDetails.targetClass.subject}</p>
              <p><strong>Faculty:</strong> ${
                swapDetails.requesterClass.faculty || "TBD"
              }</p>
              <p><strong>Room:</strong> ${swapDetails.targetClass.room}</p>
              <p><strong>Time:</strong> ${
                swapDetails.targetClass.day
              } - Period ${swapDetails.targetClass.periods[0]}</p>
            </div>
          </div>

          <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>Note:</strong> Please make note of this change and attend the class at the updated time and location.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Student notification sent to ${studentEmails.length} students`
    );
    return true;
  } catch (error) {
    console.error("Error sending student notification:", error);
    return false;
  }
};
