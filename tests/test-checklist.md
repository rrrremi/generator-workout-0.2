# Counter App Test Checklist

## Authentication Tests

- [ ] **Signup Flow**
  - [ ] User can create a new account with email, password, and full name
  - [ ] Validation works for required fields
  - [ ] Error handling for existing email addresses
  - [ ] Redirect to dashboard after successful signup

- [ ] **Login Flow**
  - [ ] User can log in with correct credentials
  - [ ] Error handling for incorrect credentials
  - [ ] "Remember me" functionality works
  - [ ] Redirect to dashboard after successful login

- [ ] **Password Reset Flow**
  - [ ] User can request password reset
  - [ ] Email is sent with reset instructions
  - [ ] User can set a new password

- [ ] **Logout Flow**
  - [ ] User can log out from any page
  - [ ] Session is properly terminated
  - [ ] Redirect to login page after logout

## Counter Functionality

- [ ] **Counter Display**
  - [ ] Counter shows correct initial value from database
  - [ ] Counter is user-specific (different users see different counts)

- [ ] **Counter Increment**
  - [ ] Click button increments counter
  - [ ] Optimistic UI update works
  - [ ] Counter persists after page refresh
  - [ ] Counter persists across different sessions

## User Profile

- [ ] **Profile Display**
  - [ ] Shows correct user email
  - [ ] Shows correct full name
  - [ ] Shows correct account creation date
  - [ ] Shows correct total click count

## Admin Panel

- [ ] **Access Control**
  - [ ] Regular users cannot access admin panel
  - [ ] Admin users can access admin panel

- [ ] **User Management**
  - [ ] All users are displayed in the table
  - [ ] Search functionality works for email and name
  - [ ] User roles are correctly displayed
  - [ ] Click counts are correctly displayed for each user

## Security

- [ ] **Row Level Security**
  - [ ] Users can only see their own profile data
  - [ ] Users can only increment their own counter
  - [ ] Admins can view all user data

- [ ] **Route Protection**
  - [ ] Unauthenticated users are redirected to login
  - [ ] Authenticated users can access protected routes
  - [ ] Non-admin users are redirected from admin routes

## UI/UX

- [ ] **Responsive Design**
  - [ ] Works on mobile devices (320px width)
  - [ ] Works on tablets (768px width)
  - [ ] Works on desktop (1024px+ width)

- [ ] **Design Compliance**
  - [ ] Uses only black and white colors (red only for errors)
  - [ ] Typography is consistent
  - [ ] Spacing and layout are consistent

- [ ] **Accessibility**
  - [ ] All interactive elements are keyboard accessible
  - [ ] Form inputs have proper labels
  - [ ] Error messages are clearly visible

## Performance

- [ ] **Page Load Speed**
  - [ ] Initial page load is fast
  - [ ] Navigation between pages is smooth
  - [ ] No unnecessary re-renders

- [ ] **Error Handling**
  - [ ] Network errors are handled gracefully
  - [ ] Form validation errors are displayed clearly
  - [ ] Server errors are handled appropriately

## Deployment

- [ ] **Environment Variables**
  - [ ] All required environment variables are set
  - [ ] No hardcoded secrets in the codebase

- [ ] **Build Process**
  - [ ] Application builds without errors
  - [ ] Production build is optimized

- [ ] **Database**
  - [ ] All required tables and views exist
  - [ ] RLS policies are correctly applied
  - [ ] Triggers for user creation work correctly
