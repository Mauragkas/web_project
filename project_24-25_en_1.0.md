# Topic: Thesis Support System
Version 1.0 06/11/2024
## Objective
The objective of this project is the development of a collaborative system to support a
common administrative process of a university, speciﬁcally the preparation of the
diploma thesis.
The users involved in the system are Students, Instructors, and the Secretariat. A thesis
concerns a speciﬁc topic, which is supervised and then examined by a Three-Member
Committee of professors. Professors create topics as supervisors, and can participate in
the supervision of topics of other professors as members of the Three-Member
Committee. The assignment of a thesis topic to a student by a professor usually happens
through an oral agreement or some other procedure by which the professor selects to
whom they will assign their topics. Subsequently, the student must request that other
professors agree to be members of the Three-Member Committee. Once everyone has
agreed, they jointly sign the topic assignment application. The student then submits it to
the Secretariat and can start working on their thesis.
During the preparation, the Instructor user monitors the student's progress. If they have
multiple students, they must keep a record to know which students have taken a thesis
with them, when they started, and how the progress is going.
At the end of their thesis, the student must be able to share the text of the thesis with the
members of the Three-Member Committee, along with any supporting material (e.g.
videos, photos, code, etc.). Then, the members of the Three-Member Committee
together with the student must set a date for the presentation of the thesis. After the
thesis is presented, the members of the Three-Member Committee record the student's
grade on the relevant form (document), which the student then submits to the
Secretariat.
ATTENTION: Before starting the design and analysis of the requirements of the work, you
should carefully read the full regulation for the preparation of theses at the Department
of Electrical and Computer Engineering (DECE) which is at the link:
https://www.ceid.upatras.gr/sites/default/ﬁles/pages/diplomatiki_ergasia_tmiyp_0.pdf
Some procedures described in the regulations are not described in the following
Functional Speciﬁcations as they are carried out outside the described application.
## Functional Speciﬁcations
In the system there are three types of users: Instructor, Student, and Secretariat. Each
type of user is authenticated for the use of the system through Login - Logout procedures:
they can log in to the system through an appropriate username/password and log out ofit. The system should not allow the display of any content in case a user is not logged in.
In case of an attempt to access any page without prior login, there is a redirection to the
login page.
**Instructor**
The main options on the Instructor's home screen are:
1) **View and Create Thesis Topics:** The Instructor records a new thesis topic with a
title, a short description (summary), and the option to attach a PDFﬁle with a detailed
presentation of the topic. The Instructor sees the list of topics they have created for
assignment and can edit each of them.
2) **Initial Assignment of a Topic to a Student:** The Instructor assigns an available topic
to a student, searching for them by their student ID or name. The topic is temporarily
assigned to the student until the other members of the Three-Member Committee agree.
The professor can cancel the assignment at any time before it isﬁnalized.
3) **View List of Theses:** The Instructor sees a list of all theses in which they have
participated in the past or are currently participating as a supervisor or member of the
Three-Member Committee. They have the ability toﬁlter the list based on the status of
the theses (under assignment, active, completed, cancelled) and based on their role in
them (supervisor, member of the Three-Member Committee). By selecting a thesis, they
can see all the relevant information about it, i.e.: the basic information (topic, student,
three-member committee), the chronology of the actions taken (status changes) and if it
has been completed, theﬁnal grade of the thesis, links to theﬁnal textﬁle in the library
repository and the (form) grading report.
Depending on their role in a particular thesis, the Instructor can then proceed with
appropriate actions regarding the status of the thesis (see point 6. Management of
Theses). Finally, they have the ability to export the list of all displayed theses in a
machine-readable format by selecting aﬁle format (CSV and JSON).
4) **View Invitations to Participate in Three-Member Committees:** The Instructor sees
a list of active invitations they have received to participate in Three-Member Committees.
By selecting one, they can accept or reject it.
5) **View Statistics:** The Instructor sees the following information in graphs:
i. Average completion time of theses a) they have supervised and/or b) in which they are
a member of the Three-Member Committee
ii. Average grade of theses a) they have supervised and/or b) in which they are a member
of the Three-Member Committee
iii. Total number of theses a) they have supervised and/or b) in which they are a member
of the Three-Member Committee6) **Management of Theses:** Depending on the status of a thesis, the Instructor can
perform the following actions:
- Under Assignment
- The Instructor can see the other Instructors - Members who have been invited to
participate and their response (invitation date, acceptance date, rejection date)
- The Instructor supervising the Thesis can cancel the assignment of the topic to a
student. This automatically deletes any invitations and assignments of participation in
Three-Member Committees.
- Active
- Regardless of role, the Instructor can record multiple notes related to the thesis work
(short text up to 300 characters). The notes are visible only to their creator.
- As a supervisor, the Instructor can cancel the assignment of a thesis (after 2 years have
elapsed since theﬁnal assignment, and by recording the number and year of the General
Assembly that decided on the cancellation). The reason for the cancellation is
automatically recorded as "by Instructor".
- As a supervisor, the Instructor can change the status to "Under Examination" so that
the student can proceed with the further actions.
- Under Examination
- Regardless of role, the Instructor can view the text of the thesis uploaded by the
student/candidate (draft).
- The Instructor as a supervisor can generate and display the announcement text for the
thesis presentation. This option is active only if the student has completed the relevant
presentation details (see Student).
- The supervising Instructor activates the ability to record the grade for the thesis and
can record their own grade (in detail according to the individual criteria). They also see
the grades recorded by the other members of the Three-Member Committee. The grades
are recorded based on the criteria provided in the DECE Thesis Regulations.
- As a member of the Three-Member Committee, the Instructor records their grade for
the thesis. They also see the grades recorded by the other members of the Three-Member
Committee.
**Student**
The main options on the Student's home screen are:
1) **View Topic:** The details of the thesis work are displayed (topic, description,
attached descriptionﬁle) and its current status, as well as the members of the Three-
Member Committee (if they have been appointed). The time elapsed since the oicial
assignment of the topic (if it has been done) is also displayed.
2) **Edit Proﬁle:** The student/candidate enters and manages their contact details (full
postal address, contact email, mobile and landline phone).3) **Manage Thesis Work**: Depending on the status of a thesis, the student/candidate
can perform the following actions:
- Under Assignment
- The student/candidate selects the Instructors they want to be members of the Three-
Member Committee and adds them, waiting for their response. As soon as the necessary
number of invited Instructors (two) have accepted, the thesis automatically transitions
to the "Active" status and any invitations to additional Instructor members are cancelled.
- Under Examination
- The student/candidate uploads the draft text of the thesis (ﬁle) which can be seen by
all members of the Three-Member Committee. They can also upload links to other
material (e.g. google driveﬁles, youtube videos, etc.).
- The student/candidate records the date and time of the examination that they have
agreed with the Three-Member Committee (a process outside the application).
Depending on the examination method (in-person or online), the relevant information is
recorded (examination room, or connection link for remote attendance).
- After the grades have been recorded by the members of the Three-Member Committee,
the student/candidate can view the examination report in HTML format. They also record
the link to the library repository (Nemertis) where theﬁnal text of their thesis is located.
- Completed
- Only the ability to view the thesis information, status changes, and the examination
report is maintained.
**Secretariat**
The main options on the Secretariat user's home screen are:
1) **View Theses:** All "Active" and "Under Examination" theses are displayed. By
selecting a thesis, the details of the thesis work (topic, description, and its current status)
are displayed, as well as the members of the Three-Member Committee (if they have
been appointed). The time elapsed since the oicial assignment of the topic (if it has
been done) is also displayed.
2) **Data Import:** The ability to import a JSONﬁle containing the personal information
of students and instructors.
3) **Management of Theses:** Depending on the status of a thesis, the Secretariat can
perform the following actions:
- Active
- The Secretariat records the AP number from the General Assembly in which the topic
assignment was approved -- This is also needed for the examination report.
- The Secretariat can cancel the assignment of a thesis topic. The Secretariat records
the number and year of the General Assembly in which the cancellation was decided. Thereason for the cancellation is automatically recorded as free text (e.g. "at the request of
the Student").
- Under Examination
- Once the grade has been recorded for the thesis and the student/candidate has posted
the link to Nemertis, the Secretariat can change the status of the thesis to "Completed".
**System Functions Regardless of Authenticated Users**
The system implements a publicly accessible endpoint (without authentication) that
contains the announcements of thesis presentations, with the ability to parameterize the
time range. The entire set of announcements covering the speciﬁed time range can be
generated as an XML or JSON Feed using an appropriate parameter.
**System Initialization**
For the presentation of your work at the end of the examination period, the system should
initially include at least 10 students, 5 instructors, and a suicient number of topics and
assignments, so that all possible states of a thesis are covered.
For the "Data Import" function of the Secretariat, you canﬁnd (and create your own) data
from here
http://usidas.ceid.upatras.gr/web/2024/index.php
Each coursework team is asked to add a few students to the online system and 1-2
instructors. In this way, there will be enough records in the "common repository" for you
to test your system.
Note that the common repository records DO NOT have usernames/passwords - Make
sure to create the appropriateﬁelds when importing the data into your system, e.g. you
can use the emails as user names and generate random passwords when importing the
data for each user.
## Constraints
1. Groups of 3 (three) people maximum.
2. The core of your deliverable must be implemented exclusively with technologies taught
in the course (PHP , JavaScript, Node.JS, HTML).
3. The appearance and functionality of the application is evaluated.
## Deliverables
1. A summary report that will include:a. The database design (Entity-Relationship Diagram for relational databases,
description of the basic data model for non-relational databases).
b. Presentation of the application with a series of Screenshots. You can present them in
the order described in the application speciﬁcations in the assignment, or following your
own demonstration scenario for the application.
c. The settings you made on your server to properly utilize the caching capabilities
(caches, e.g. setting TTLs for dierent types ofﬁles). Mention the relevant conﬁgurations
you made in the server conﬁguration, or through .htaccess, or inline response header
deﬁnitions and provide some screenshots from the browser's developer tools to show
that the settings you made had an eect. Support the relevant choices regarding the rules
you implemented or the values you selected for various parameters, with relevant
references to technical articles or scientiﬁc literature.
2. The source code and a database export
3. All the above (1) and (2) are submitted in a compressedﬁle on eclass.
## Use of Technologies
- You will exclusively use open-source technologies for the database (MySQL,
PostgreSQL, MongoDB) and any other functionality required by your work.
- The loading of data from the database for the presentation of content on the web pages
must be done using **exclusively** AJAX techniques.
- In any case, avoid the use of PHP to create JavaScript code. The following examples are
indicative of what you **should NOT do**:
> Example 1: use of php toﬁll in javascript code
>
> <script type="text/javascript">
>
> var my_var = <?php echo json_encode($my_var); ?>;
>
> </script>
>
> ------------------------------
>
> Example 1: use of php to create entire javascript code sections
>
> <?php
>
> echo "var test";
>> echo "function logvar(f){
>
> console.log(f);
>
> ";
>
> echo "logvar(test);";
>
> ?>;
- Attention to the database: Use appropriate indexes on the tables to speed up the
queries.
- Particularly the front-end of the "Student" user should be accessible from mobile
devices, so make sure to use a responsive design.
## Additional information
- If you wish, you can experiment with displaying the examination report in PDF format
using any open-source library you like, some examples are here
https://dev.to/handdot/generate-a-pdf-in-js-summary-and-comparison-of-libraries-
3k0p
- For creating charts, the use of the chart.js library is recommended
https://www.chartjs.org/
- The regulations for the preparation of theses and templates of the forms/information
related to theses are available here
https://www.ceid.upatras.gr/sites/default/ﬁles/pages/diplomatiki_ergasia_tmiyp_0.pdf
- You can also experiment with the integration of a WYSIWIG editor for the free text (e.g.
thesis descriptions)
