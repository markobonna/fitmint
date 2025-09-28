import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  // Load testing configuration for 100K+ users
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Increase to 500 users
    { duration: '10m', target: 1000 }, // Scale to 1000 users
    { duration: '5m', target: 500 },   // Scale down
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Performance requirements
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.1'],              // Custom error rate below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.fitmint.world';

export default function() {
  // Health check endpoint
  let response = http.get(`${BASE_URL}/api/health`);
  let healthCheck = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!healthCheck);
  
  sleep(1);
  
  // Main application page
  response = http.get(BASE_URL);
  let pageLoad = check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 2s': (r) => r.timings.duration < 2000,
    'homepage has correct title': (r) => r.body.includes('FitMint'),
  });
  errorRate.add(!pageLoad);
  
  sleep(2);
  
  // Leaderboard page (high traffic expected)
  response = http.get(`${BASE_URL}/leaderboard`);
  let leaderboardCheck = check(response, {
    'leaderboard status is 200': (r) => r.status === 200,
    'leaderboard response time < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!leaderboardCheck);
  
  sleep(1);
  
  // API endpoints
  response = http.get(`${BASE_URL}/api/health-data`);
  let apiCheck = check(response, {
    'API status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'API response time < 1s': (r) => r.timings.duration < 1000,
  });
  errorRate.add(!apiCheck);
  
  sleep(3);
  
  // Simulate user authentication flow
  const verifyPayload = JSON.stringify({
    action: 'fitness-verification',
    signal: 'test-user-' + Math.random(),
  });
  
  response = http.post(`${BASE_URL}/api/verify`, verifyPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let verifyCheck = check(response, {
    'verify endpoint responds': (r) => r.status < 500,
    'verify response time < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!verifyCheck);
  
  sleep(2);
  
  // Test metrics endpoint (should be fast)
  response = http.get(`${BASE_URL}/api/metrics`);
  let metricsCheck = check(response, {
    'metrics endpoint status is 200': (r) => r.status === 200,
    'metrics response time < 1s': (r) => r.timings.duration < 1000,
    'metrics contains prometheus data': (r) => r.body.includes('fitmint_'),
  });
  errorRate.add(!metricsCheck);
  
  sleep(1);
}

// Setup function - runs once per VU at the beginning
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  
  // Verify the service is available before starting the test
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Service is not ready. Health check returned ${response.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after all VUs have finished
export function teardown(data) {
  console.log('Load test completed for', data.baseUrl);
}