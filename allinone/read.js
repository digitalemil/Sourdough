import { sleep } from 'k6'
import http from 'k6/http'

// See https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
export const options = {
  stages: [
    { duration: '1m', target: 4 },
    { duration: '12m', target: 8 },
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
  let url=  "http://localhost:${__ENV.PORT}/random/withcode?code=${__ENV.CODE}"
  
  const params = {
      timeout: '8s'
  };
  
  let res = http.get(url, params);
  
}
