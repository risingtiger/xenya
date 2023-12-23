

import { PubSub }     from "@google-cloud/pubsub";
import functions from "@google-cloud/functions-framework"
import { initializeApp, cert }  from "firebase-admin/app";
import { Save_Status }  from "./savestatus.js";




let pubsub:any;
let pubsubSubscriptionForLocalUse:any;




if (process.platform === 'darwin') {
  initializeApp({   credential: cert('/Users/dave/.ssh/xenition_local.json')   })

} else {
  initializeApp()
}




(process.openStdin()).addListener("data", async (a) => {

  let data = (Buffer.from(a, 'base64').toString()).trim();

  if (data === "pubsub") {

    let configPubSub = {
	    gcpProjectId: 'xenition',
	    gcpPubSubSubscriptionName: 'xenya',
	    gcpServiceAccountKeyFilePath: '/Users/dave/.ssh/xenition_local.json'
	  };


    pubsub = new PubSub({
	    projectId: configPubSub.gcpProjectId,
	    keyFilename: configPubSub.gcpServiceAccountKeyFilePath,
    });

    pubsubSubscriptionForLocalUse = pubsub.subscription(configPubSub.gcpPubSubSubscriptionName);

    pubsubSubscriptionForLocalUse.on('message', (message:any) => {
	    //routePubIn(message)
	    message.ack();
	  });


  } else if (data == "savestatus") {
    Save_Status("t36,38;h7,12;d1698457047") // t(tempf high, tempf low); h(heating_on_count, heating_duration_seconds); d(timestamp)
  }

})




functions.cloudEvent('xenya', async (cloud_event:any) => {

    const eventstr     = Buffer.from(cloud_event.data.message.data, 'base64').toString()
    const event_name   = cloud_event.data.message.attributes.event
    const device_id    = cloud_event.data.message.attributes.device_id

    console.log(event_name)
    console.log(eventstr)
    console.log(device_id)

    if (event_name.includes("solar")) {
        await Save_Status(eventstr)
    }
})





