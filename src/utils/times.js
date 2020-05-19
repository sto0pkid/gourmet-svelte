let M = 60;
let H = 60*60;
let D = H * 24;
let W = D * 7;
let MNTH = D * 31
let YR = D * 365;
import {floatToFrac} from './numbers.js';


function f2 (n) {
    return Math.floor(n).toString(10).padStart(2,'0')
}
function f (n) {
   return Math.floor(n).toString(10)
}

const timeWords = [
    {matcher:/\b(sec(ond)?s?)\b/i,
     value:1},
    {matcher:/\b(min(ute)?s?)\b/i,
     value:M},
    {matcher:/\b(h(ou)?rs?)\b/i,
     value:H},
    {matcher:/\b(da?ys?)\b/i,
     value:D},
    {matcher:/\b(we+ks?)\b/i,
     value:W},
    {matcher:/\b(mo?n?ths)\b/i,
     value:MNTH},
    {matcher:/\b(y(ea)?rs?)\b/i,
     value:YR}
]

export default {

    getTimeUnit (s) {
        for (let matcher of timeWords) {
            if (s.match(matcher.matcher)) {
                return matcher.value;
            }
        }
    },
    
    getTimeLabel (s) {
        if (s < 0) {
            return '-' + this.getTimeLabel(-1*s);
        }
        if (s < H) {
            return `${f2(s / 60)}:${f2(s % 60)}`
        }
        else if (s < H * 24) {
            return `${f(s / (H))}h:${f2((s % (H)/60))}`
        }
        else if (s < H * 24 * 14) {
            return `${f(s / (H*24))} days`
        }
        else if (s < H * 24 * 7 * 12) {
            return `${f(s / (H*24*7))} weeks`
        }
        else if (s < H * 24 * 365) {
            return `${f(s / (H*24*31))} months`
        }
        else  {
            return `${f(s / (H*24*365))} years`
        }
    },

    getScale (s) {
        if (s <= 60) { // one minute timer
            return {m:60,u:5};
        }
        else if (s <= 60 * 15) { // fifteen minute timer
            return {m:60*12,u:30} // 30 second units
        }
        else if (s <= H) { // hour timer
            return {m:H,u:5*60} // 5 minute units
        }
        else if (s <= H*4) { // four hours...
            return {m:H*4,u:15*60} // fifteen minute units
        }
        else if (s <= H*12) { // 12 hour timer
            return {m:H*12,u:30*60} // 30 minute units
        }
        else if (s <= H*24) { // 24 hour timer
            return {m:H*24,u:H} // hour units
        }
        else if (s <= H*24*7) { // one week timer
            return {m:H*24*7,u:24*H} // one day units
        }
        else if (s <= H*24*31) { // one month timer
            return {m:H*24*31,u:24*7*H} // one week units
        }
        else { // 5 year timer
            return {m:H * 24 * 365 * 5,
                    u:H * 24 * 365/4} // quarter year units
        }
    },

    getHMS (seconds) {
        if (isNaN(seconds)) {
            new Error(
                `getHMS requires a number but got ${seconds}`
            );
        }
        let hours = Math.floor(seconds / H)
        let remainder = seconds - (hours*H)
        let minutes = Math.floor(remainder / M);
        seconds = Math.floor(remainder - (minutes*M))
        return {
            seconds,minutes,hours
        }
    },

    HMStoSeconds (HMS) {
        return HMS.hours * H + HMS.minutes * M + HMS.seconds
    },

    getDescription (s) {
        s = Math.floor(s)
        const hms = this.getHMS(s);
        if (!hms.hours) {
            if (!hms.minutes) {
                return `${hms.seconds} seconds`
            }
            if (!hms.seconds) {
                return `${floatToFrac(hms.minutes,{fallbackDigits:0})} minutes`
            }
            return `${floatToFrac(hms.minutes)} minutes, ${floatToFrac(hms.seconds,{fallbackDigits:0})} seconds`
        }
        if (hms.hours < 24) {
            return `${floatToFrac(s/H,{fallbackDigits:0})} hours`
        }
        else if (hms.hours < 24*7) {
            return `${floatToFrac(s/D,{fallbackDigits:0})} days`
        }
        else if (hms.hours < 35*7) {
            return `${floatToFrac(s/W,{fallbackDigits:0})} weeks`
        }
        else if (hms.hours < 24*7*365) {
            return `${floatToFrac(s/MNTH,{fallbackDigits:0})} months`
        }
        else {
            return `${floatToFrac(s/YR,{fallbackDigits:0})} years`
        }
    }

}