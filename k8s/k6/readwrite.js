import { sleep } from 'k6'
import http from 'k6/http'

// See https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
export const options = {
  stages: [
    { duration: '1m', target: 2 },
    { duration: '3m', target: 4 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'], // http errors should be less than 2%
    http_req_duration: ['p(95)<2000'], // 95% requests should be below 2s
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },
}

export default function main() {
   //curl -XPOST -L -H "Content-type: application/text" -H "x-api-key: rose" -d 'fleur/rose' http://localhost:3000/create
  let url=  "http://ticketsdb.tickets:3000/create"
  
  let user= "fleur";
  if(Math.random()< 0.66) {
    if(Math.random()< 0.5) {
      user= "joe";
    }
    else {
      user= "fleur";
    }
  }
  let res = http.post(url, user+'/rose', {
    headers: { 'Content-Type': 'application/text', 'x-api-key':'rose' }, 
    timeout: '8s'
  });
  
}
