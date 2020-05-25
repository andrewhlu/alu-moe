import * as admin from "firebase-admin";
import config from "./config";

const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCT);

function initFirebaseDatabase() {
    // Try to return the FirebaseApp instance to check if the Admin SDK is initialized
    try {
        admin.app();
        console.log("Firebase Admin SDK is already intialized");
    }
    catch(err) {
        console.log("Firebase Admin SDK is not initialized, initializing...");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://" + serviceAccount.project_id + ".firebaseio.com"
        });
        console.log("Firebase Admin SDK successfully initialized");
    }

    return admin.database();
}

export async function getData(ref) {
    const database = initFirebaseDatabase();
    const response = await database.ref(ref).once('value');
    return response.val();
}

export async function setData(ref, data) {
    const database = initFirebaseDatabase();
    const error = await database.ref(ref).set(data);
    return error;
}
