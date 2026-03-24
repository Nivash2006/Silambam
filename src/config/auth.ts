/**
 * Authentication Configuration for Maha Silambam & Martial Academy
 * 
 * This file contains the authorized credentials for the single-user system.
 * Update these values to change the authorized email and mobile number.
 */

export const AUTHORIZED_CREDENTIALS = {
  // The authorized email ID for login
  email: 'mahasilambamacademy@gmail.com',

  // The authorized mobile number for login
  mobile: '8838737875',

  // The password required for the login screen
  loginPassword: 'Maha@2007',

  // Master Access Cipher for Supabase authentication (internal use)
  // This should match the password of the account in your Supabase project.
  masterPassword: 'Maha@2007',
};
