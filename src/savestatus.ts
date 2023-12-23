
import { InfluxDB, Point } from '@influxdata/influxdb-client';


type str = string;type int = number;type bool = boolean;

type StatusT = {
    temps_stats: {high:int, low:int},
    heating_stats: {on_count:int, duration:int},
    ts: int
}




async function Save_Status(str: str) {

    return new Promise(async (res, _rej)=> {

        const new_status_parsed = parse_str(str)

        const n   = new_status_parsed

        await save_to_server(n)

        res(1)
    })
}




function save_to_server(status:StatusT) {   

    return new Promise(async (res, _rej)=> {

        await write_telemetry_to_influxdb(status)

        res(1)
    })
}




function parse_str(str: str) : StatusT {

    let temps_stats   = {high:0, low:0};
    let heating_stats = {on_count:0, duration:0};
    let ts            = 0;

    let split         = str.split(";");
    let vals          = []

    split.forEach( s => {

        switch (s.charAt(0)) {

            case "t":  
                vals = s.substring(1).split(",")
                temps_stats.high = Number(vals[0])
                temps_stats.low  = Number(vals[1])
                break;

            case "h":  
                vals = s.substring(1).split(",")
                heating_stats.on_count = Number(vals[0])
                heating_stats.duration  = Number(vals[1])
                break;

            case "d":  
                ts = Number(s.substring(1))
                break;
        }
    })

    return { temps_stats, heating_stats, ts };
} 




function write_telemetry_to_influxdb(status: StatusT) {   

    return new Promise(async (res, _rej) => {

        let token                 = process.env.INFLUXDB_TOKEN as str 
        let url                   = 'https://us-central1-1.gcp.cloud2.influxdata.com';
        let client                = new InfluxDB({url, token})
        let org                   = `accounts@risingtiger.com`;
        let bucket                = `XEN`;
        let writeClient           = client.getWriteApi(org, bucket, 's')

        const val_tmpr_high = new Point("solarbattery_tmpr").intField("high", status.temps_stats.high).timestamp(status.ts)
        const val_tmpr_low = new Point("solarbattery_tmpr").intField("low", status.temps_stats.low).timestamp(status.ts)
        const val_heating_on_count = new Point("solarbattery_heating").intField("oncount", status.heating_stats.on_count).timestamp(status.ts)
        const val_heating_duration = new Point("solarbattery_heating").intField("duration", status.heating_stats.duration).timestamp(status.ts)

        writeClient.writePoint(val_tmpr_high)
        writeClient.writePoint(val_tmpr_low)
        writeClient.writePoint(val_heating_on_count)
        writeClient.writePoint(val_heating_duration)

        try {
            await writeClient.flush()
        }
        catch (e) {
            console.error("error in write_telemetry_to_influxdb writeClient.flush()")
            console.error(e)
            res(1)
        }

        try {
            await writeClient.close()
        }
        catch (e) {
            console.error("error in write_telemetry_to_influxdb writeClient.close()")
            console.error(e)
            res(1)
        }

        res(1)
    })
} 




export { Save_Status }




