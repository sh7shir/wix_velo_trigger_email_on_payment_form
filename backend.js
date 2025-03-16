import { Permissions, webMethod } from "wix-web-module";
import { contacts } from "wix-crm-backend";
import { triggeredEmails } from "wix-crm-backend";
import wixData from "wix-data";
import wixCrmBackend from "wix-crm-backend";

// Main function to create contacts, send emails, and delete contacts after a delay
export const myCreateContactFunction = webMethod(Permissions.Anyone, async (selected, formData) => {
    try {
        // Retrieve recipient emails
        const recipientEmails = await getEmails(selected);

        console.log("Recipient Emails:", recipientEmails);
        console.log("Form Data:", formData);

        // Step 1: Create all contacts and collect their IDs
        const contactIds = [];
        for (const mEmail of recipientEmails) {
            try {
                const contact = await createContact(mEmail);
                contactIds.push(contact._id);
                console.log("Contact created:", contact);
            } catch (error) {
                console.error("Error creating contact for email:", mEmail, error);
            }
        }

        console.log("All contacts created:", contactIds);

        // Step 2: Send emails to the created contacts
        const emailPromises = contactIds.map((contactId) =>
            sendEmail(contactId, formData)
        );
        await Promise.all(emailPromises);
        console.log("Emails sent to all contacts.");

        // Step 3: Wait for 20 seconds before deleting contacts
        console.log("Waiting for 20 seconds before deleting contacts...");
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Step 4: Delete all contacts
        const deletePromises = contactIds.map((contactId) => deleteContact(contactId));
        await Promise.all(deletePromises);
        console.log("All contacts deleted successfully.");
    } catch (error) {
        console.error("Error in the contact/email/delete process:", error);
        throw error;
    }
});

// Function to create a contact
async function createContact(email) {
    const recipientInfo = {
        name: {
            first: "Musician", // Static or dynamic first name
            last: "Contact Temp", // Static or dynamic last name
        },
        emails: [{
            email: email, // Email from the array
            tag: "WORK",
        }],
    };

    const options = {
        allowDuplicates: true,
        suppressAuth: true,
    };

    return contacts.createContact(recipientInfo, options);
}

// Function to send an email to a contact
async function sendEmail(contactId, formData) {
    const emailData = {
        variables: {
            name: formData.name,
            email: formData.email,
            amount: formData.amount,
            time: formData.timeAndDate,
        },
    };

    try {
        await triggeredEmails.emailContact("UUQhZsB", contactId, emailData);
        console.log(`Email sent to contact with ID ${contactId}`);
    } catch (error) {
        console.error(`Error sending email to contact with ID ${contactId}:`, error);
        throw error;
    }
}

// Function to delete a contact
async function deleteContact(contactId) {
    try {
        await wixCrmBackend.deleteContact(contactId, { deleteMembers: false });
        console.log(`Contact with ID ${contactId} deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting contact with ID ${contactId}:`, error);
        throw error;
    }
}

// Retrieve emails from the database
export const getEmails = webMethod(
    Permissions.Anyone,
    async (selected) => {
        try {
            const result = await wixData.query("byom")
                .eq("mName", selected) // 1st Musician
                .or(wixData.query("byom").eq('m2Name', selected)) // Second Musician
                .find();

            if (result.items.length === 0) {
                throw new Error("No recipients found for the selected category.");
            }

            const emailData = result.items.map(entry => ({
                primary: entry.pEmail,
                secondary: entry.sEmail,
                musician: entry.mEmail,
                musician2: entry.m2Email
            }));

            console.log(emailData)

            const emailArray = [
                emailData[0].primary,
                emailData[0].secondary,
                emailData[0].musician,
                emailData[0].musician2
            ];

            return emailArray;
        } catch (error) {
            console.error("Error querying database:", error);
            throw new Error("Failed to retrieve email data.");
        }
    }
);
