export {};

declare global {
  interface Window {
    // We declare Outseta as 'any' to allow access to the global object
    // You can replace 'any' with a specific interface if you have the Outseta SDK types
    Outseta: any;
  }
}
