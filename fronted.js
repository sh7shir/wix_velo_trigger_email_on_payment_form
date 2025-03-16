// Import the backend web module
import { myCreateContactFunction } from 'backend/myWebModule.web.js';

// Add event listener to the button
$w.onReady(function () {
    $w('#wixForms1').onWixFormSubmitted(async () => {

        let selected = $w('#dropdown1').value;
        const formData = {
            name: $w('#fName').value + " " + $w('#lName').value,
            email: $w('#email').value,
            amount: $w('#amount').value,
            timeAndDate: new Date().toISOString()
        };

        // Call the backend function to create the contact and send email

        myCreateContactFunction(selected, formData)
            .then((result) => {
                console.log("Contact created successfully");
            })
            .catch((error) => {
                console.error("Error creating contact:", error);
            });

    })

});
