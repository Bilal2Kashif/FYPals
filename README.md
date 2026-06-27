================================================================================
                    FYPals — University FYP Collaboration Platform
                             Setup & Installation Guide (Windows)
================================================================================

Backend  : Spring Boot — runs on port 8080
Frontend : Next.js    — runs on port 3000
Database : MS SQL Server — database name: fypals
Java     : 17 or higher
Node.js  : v24.15.0 (or latest LTS)

This guide starts from scratch and covers every installation step.

================================================================================
STEP 1 — INSTALL JAVA 17
================================================================================

The backend is a Spring Boot application and requires Java 17 or higher.

1. Go to: https://www.oracle.com/java/technologies/downloads/
2. Click the Windows tab.
3. Download the x64 Installer (.exe file).
4. Run the installer and click through all the defaults. No changes needed.

Verify the installation:
  Open PowerShell (Win + X → Windows PowerShell) and run:

      java -version

  You should see output like: java version "17.0.x" or higher.
  If you see an error, restart your computer and try again.

NOTE: If you already have a newer Java version (18, 21, etc.) installed,
      that will work fine. No need to downgrade.


================================================================================
STEP 2 — INSTALL NODE.JS
================================================================================

The frontend is a Next.js application and requires Node.js to run.

1. Go to: https://nodejs.org
2. Click the LTS button (Long Term Support — the recommended version).
3. Download the Windows Installer (.msi file).
4. Run the installer and accept the license agreement, clicking Next through all screens.
5. On the "Tools for Native Modules" screen, check the box that says
   "Automatically install the necessary tools".
6. Finish the installation.

Verify the installation:
  Open a new PowerShell window and run:

      node --version
      npm --version

  You should see version numbers printed for both.
  If not, restart your computer and try again.


================================================================================
STEP 3 — INSTALL INTELLIJ IDEA
================================================================================

IntelliJ IDEA is the IDE used to run both the backend and frontend.

1. Go to: https://www.jetbrains.com/idea/download/
2. Download the Community Edition (free) — click "Other versions" if the
   Ultimate edition is shown by default.
3. Run the installer.
4. On the Installation Options screen, check these boxes:
     - Add launchers dir to the PATH
     - Add 'Open Folder as Project'
     - .java — Associate .java files
5. Click Next and finish the installation.
6. Launch IntelliJ IDEA. On first launch, choose "Do not import settings"
   and pick a theme (Dark or Light — your preference).

NOTE: The Community Edition is completely free and has everything needed
      to run FYPals.


================================================================================
STEP 4 — INSTALL MS SQL SERVER EXPRESS
================================================================================

The backend stores all data in Microsoft SQL Server. Express is the free version.

1. Go to: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Scroll down to SQL Server 2022 Express and click "Download now".
3. Run the downloaded installer.
4. When prompted to choose an installation type, select Basic.
5. Accept the license terms and click Install.
6. Wait for the installation to complete (may take several minutes).

Note the Server Name:
  At the end of the installation, a summary screen appears. Look for the
  CONNECTION STRING section and note the server name. It will look like:

      Server=localhost\SQLEXPRESS

  You will need this in Step 6.

NOTE: If the installer asks you to restart your computer, do so before continuing.


================================================================================
STEP 5 — INSTALL SQL SERVER MANAGEMENT STUDIO (SSMS)
================================================================================

SSMS is the tool used to create and manage the database.

1. Go to: https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
2. Click "Download SSMS" (the link at the top of the page).
3. Run the installer and click through all the defaults.
4. Restart your computer if prompted.


================================================================================
STEP 6 — CREATE THE DATABASE
================================================================================

--- Connect to SQL Server ---

1. Open SQL Server Management Studio from the Start menu.
2. In the Connect to Server dialog, enter:
     Server type    : Database Engine
     Server name    : localhost\SQLEXPRESS
     Authentication : Windows Authentication
3. Click Connect.

--- Create the Database ---

1. In the Object Explorer panel on the left, right-click on Databases.
2. Click "New Database..."
3. In the Database name field, type exactly: fypals  (all lowercase)
4. Click OK.

Spring Boot will automatically create all the required tables when the
backend first starts.

--- Set Up SQL Server Authentication ---

The project connects using username "sa" and password "Admin1234!".
You need to enable this:

1. In Object Explorer, right-click the top-level server name
   (e.g. DESKTOP-XXX\SQLEXPRESS).
2. Click Properties.
3. Click Security in the left panel.
4. Under Server authentication, select "SQL Server and Windows Authentication mode".
5. Click OK.
6. In Object Explorer, expand Security → Logins.
7. Right-click on sa and click Properties.
8. Click General — set the password to: Admin1234!
9. Click Status — set Login to Enabled.
10. Click OK.
11. Restart SQL Server: right-click the server in Object Explorer → Restart.

WARNING: The password must be exactly Admin1234! — capital A and exclamation
         mark included.


================================================================================
STEP 7 — OPEN THE PROJECT IN INTELLIJ
================================================================================

1. Open IntelliJ IDEA.
2. On the Welcome screen, click "Open".
3. Browse to the folder where the source code is located and select it.
4. Click OK / Trust Project if prompted.
5. If IntelliJ asks about Maven build files, click "Load Maven Project".

Project Structure:
  After opening you will see two main folders:

      FY_Pals/    →  The Spring Boot backend
      frontend/   →  The Next.js frontend


================================================================================
STEP 8 — CONFIGURE THE BACKEND
================================================================================

The backend needs to know how to connect to the database.
The configuration file is already included — just verify it is correct.

1. In the IntelliJ Project panel on the left, expand:
       FY_Pals → src → main → resources → application.properties

2. Verify it contains the following:

      spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=fypals;encrypt=false;trustServerCertificate=true
      spring.datasource.username=sa
      spring.datasource.password=Admin1234!
      spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
      spring.jpa.hibernate.ddl-auto=update
      jwt.secret=fypalssupersecretkey1234567890abcdef
      jwt.expiration=7200000
      spring.mail.host=smtp.gmail.com
      spring.mail.port=587
      spring.mail.username=l243049@lhr.nu.edu.pk
      spring.mail.password=[provided separately]
      spring.mail.properties.mail.smtp.auth=true
      spring.mail.properties.mail.smtp.starttls.enable=true

NOTE: The mail password is already configured with the project email.
      Do not change it.(right now it contains my university email used for testing)

--- Install Backend Dependencies ---

IntelliJ will automatically download all Maven dependencies when you open
the project. Watch the progress in the bottom status bar and wait for it
to finish before proceeding.

If it does not start automatically:
  Right-click on FY_Pals/pom.xml → Maven → Reload Project.


================================================================================
STEP 9 — RUN THE BACKEND
================================================================================

1. In IntelliJ, click Terminal at the bottom of the screen.
2. A PowerShell terminal opens inside IntelliJ.
3. Navigate into the backend folder:

       cd FY_Pals

4. Run the backend:

       .\mvnw spring-boot:run

5. Wait for startup to complete. When you see:

       Started FYPalsApplication in X.XXX seconds

   The backend is running on http://localhost:8080

TIP: Keep this terminal open the entire time you are using the app.
     Closing it stops the backend.

Verify the backend is running:
  Open a new PowerShell window and run:

      Invoke-WebRequest -Uri http://localhost:8080/auth/login -Method POST

  If you get any response (even an error about a missing body), the backend
  is running correctly.

WARNING: If you see a port 1433 connection error, SQL Server is not running.
         Open Services (Win + R → services.msc) and start
         "SQL Server (SQLEXPRESS)".


================================================================================
STEP 10 — RUN THE FRONTEND
================================================================================

1. In IntelliJ, click the + button in the Terminal panel to open a new terminal tab.
2. Navigate to the frontend folder:

       cd frontend

3. Install frontend dependencies (first time only):

       npm install

4. Wait for npm to finish installing all packages.
5. Start the frontend:

       npm run dev

6. When you see:

       ready - started server on 0.0.0.0:3000, url: http://localhost:3000

   Open Google Chrome and go to: http://localhost:3000

TIP: Keep this terminal open too. You now have two terminals running —
     one for the backend (port 8080) and one for the frontend (port 3000).

NOTE: npm install only needs to be run once. After that, just use
      npm run dev each time you start the app.


================================================================================
STEP 11 — CREATE THE ADMIN ACCOUNT
================================================================================

The first admin account must be registered via the website, then its role
upgraded using the API.

1. Go to: http://localhost:3000/auth/register
2. Fill in the following details:
     Name     : Admin User
     Email    : admin@test.com
     Password : password123
     Role     : Student
3. Click Create Account. You will be redirected to the student dashboard.

4. Open PowerShell and run the following to log in and get a token:

       Invoke-RestMethod -Uri 'http://localhost:8080/auth/login' `
         -Method POST -ContentType 'application/json' `
         -Body '{"email":"admin@test.com","password":"password123"}'

5. Copy the token value from the response.

6. Run the following to list all users (replace YOUR_TOKEN with the copied token):

       Invoke-RestMethod -Uri 'http://localhost:8080/admin/users' `
         -Method GET `
         -Headers @{Authorization='Bearer YOUR_TOKEN'}

7. Find the admin user's ID in the response.

8. Run the following to promote the account to ADMIN
   (replace ID and YOUR_TOKEN):

       Invoke-RestMethod -Uri 'http://localhost:8080/admin/users/ID/role' `
         -Method PUT -ContentType 'application/json' `
         -Headers @{Authorization='Bearer YOUR_TOKEN'} `
         -Body '{"role":"ADMIN"}'

9. Log out of the website and log back in as admin@test.com.
   You will now land on the Admin dashboard.

--- Create Remaining Accounts via the Admin Panel ---

1. Log in as admin@test.com and go to Admin → Users.
2. Click Create User and add the following accounts:

       Email                 Password
       ---------------------+-----------
       student@test.com      password123
       teammate@test.com     password123
       advisor@test.com      password123
       staff@test.com        password123


================================================================================
TROUBLESHOOTING
================================================================================

Backend won't start — port 8080 already in use
  Another process is using port 8080. In PowerShell run:

      netstat -ano | findstr :8080

  Note the PID in the last column, then run (replace PID):

      taskkill /PID PID /F

----

Cannot connect to SQL Server — port 1433 error
  1. Press Win + R, type services.msc, press Enter.
  2. Find "SQL Server (SQLEXPRESS)" in the list.
  3. Right-click it and click Start.
  4. Also check "SQL Server Browser" — start it if stopped.

----

npm install fails with permission errors
  Right-click the IntelliJ shortcut and select "Run as Administrator",
  then try again.

----

Frontend shows a blank page after login
  Open Chrome DevTools (F12) → Console tab.
  If you see a CORS error, the backend is not running. Start it first.

----

Maven build fails — cannot download dependencies
  You need an active internet connection when running the backend for the
  first time. Maven downloads all dependencies automatically. Once
  downloaded, it works offline.

----

Login works but redirects to the wrong page
  Clear your browser's localStorage:
  Open DevTools (F12) → Console tab → paste:

      localStorage.clear()

  Then log in again.

----

Getting 401 errors on all API calls
  Your JWT token has expired (tokens last 2 hours).
  Log out and log back in to get a new token.

================================================================================
                    FYPals — Built with Spring Boot, Next.js, and MS SQL Server
================================================================================
