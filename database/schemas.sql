-- Users and Authentication
CREATE TABLE IF NOT EXISTS User (
    userID INTEGER PRIMARY KEY,
    passwordHash TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    userType TEXT NOT NULL CHECK(userType IN ('student', 'instructor', 'secretariat'))
);

CREATE TABLE IF NOT EXISTS Student (
    studentID INTEGER PRIMARY KEY,
    studentRegNo TEXT NOT NULL UNIQUE,
    postalAddress TEXT NOT NULL,
    contactEmail TEXT NOT NULL,
    mobilePhone TEXT NOT NULL,
    landlinePhone TEXT NOT NULL,
    FOREIGN KEY (studentID) REFERENCES User(userID)
);

CREATE TABLE IF NOT EXISTS Instructor (
    instructorID INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    FOREIGN KEY (instructorID) REFERENCES User(userID)
);

CREATE TABLE IF NOT EXISTS Secretariat (
    secretariatID INTEGER PRIMARY KEY,
    FOREIGN KEY (secretariatID) REFERENCES User(userID)
);

-- Thesis Topics
CREATE TABLE IF NOT EXISTS ThesisTopic (
    topicID INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detailedPresentationPDF_path TEXT,
    status TEXT NOT NULL CHECK(status IN ('available', 'assigned_temporarily', 'assigned_finalized')),
    creationDate DATETIME NOT NULL,
    createdBy_instructorID INTEGER NOT NULL,
    FOREIGN KEY (createdBy_instructorID) REFERENCES Instructor(instructorID)
);

-- Thesis Management
CREATE TABLE IF NOT EXISTS Thesis (
    thesisID INTEGER PRIMARY KEY,
    studentID INTEGER NOT NULL,
    topicID INTEGER NOT NULL,
    supervisorID INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('under_assignment', 'active', 'under_examination', 'completed', 'cancelled')),
    initialAssignmentDate DATETIME,
    finalAssignmentDate DATETIME,
    completionDate DATETIME,
    finalGrade DECIMAL(4,2),
    thesisTextDraft_path TEXT,
    nemertisRepositoryLink TEXT,
    examinationReportHTML_path TEXT,
    gaCancellationNumber TEXT,
    gaCancellationYear INTEGER,
    cancellationReason TEXT,
    gaApprovalNumber_assignment TEXT,
    FOREIGN KEY (studentID) REFERENCES Student(studentID),
    FOREIGN KEY (topicID) REFERENCES ThesisTopic(topicID),
    FOREIGN KEY (supervisorID) REFERENCES Instructor(instructorID)
);

-- Committee Management
CREATE TABLE IF NOT EXISTS CommitteeMembership (
    thesisID INTEGER,
    instructorID INTEGER,
    role TEXT NOT NULL CHECK(role IN ('supervisor', 'member')),
    invitationDate DATETIME NOT NULL,
    acceptanceDate DATETIME,
    rejectionDate DATETIME,
    invitationStatus TEXT NOT NULL CHECK(invitationStatus IN ('pending', 'accepted', 'rejected')),
    PRIMARY KEY (thesisID, instructorID),
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID),
    FOREIGN KEY (instructorID) REFERENCES Instructor(instructorID)
);

-- Progress Tracking
CREATE TABLE IF NOT EXISTS ProgressNote (
    noteID INTEGER PRIMARY KEY,
    thesisID INTEGER NOT NULL,
    createdBy_instructorID INTEGER NOT NULL,
    noteText TEXT NOT NULL CHECK(length(noteText) <= 300),
    creationDate DATETIME NOT NULL,
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID),
    FOREIGN KEY (createdBy_instructorID) REFERENCES Instructor(instructorID)
);

-- Supporting Materials
CREATE TABLE IF NOT EXISTS ThesisSupportingMaterial (
    materialID INTEGER PRIMARY KEY,
    thesisID INTEGER NOT NULL,
    uploadedBy_studentID INTEGER NOT NULL,
    materialLink TEXT NOT NULL,
    description TEXT,
    uploadDate DATETIME NOT NULL,
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID),
    FOREIGN KEY (uploadedBy_studentID) REFERENCES Student(studentID)
);

-- Examination
CREATE TABLE IF NOT EXISTS Examination (
    examinationID INTEGER PRIMARY KEY,
    thesisID INTEGER NOT NULL UNIQUE,
    examinationDateTime DATETIME NOT NULL,
    examinationMethod TEXT NOT NULL CHECK(examinationMethod IN ('in_person', 'online')),
    locationDetails TEXT NOT NULL,
    presentationAnnouncementText TEXT,
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID)
);

-- Grading System
CREATE TABLE IF NOT EXISTS GradingCriterion (
    criterionID INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    maxPoints INTEGER
);

CREATE TABLE IF NOT EXISTS ThesisGrade (
    thesisID INTEGER,
    instructorID INTEGER,
    criterionID INTEGER,
    gradeValue DECIMAL(4,2) NOT NULL,
    gradingDate DATETIME NOT NULL,
    PRIMARY KEY (thesisID, instructorID, criterionID),
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID),
    FOREIGN KEY (instructorID) REFERENCES Instructor(instructorID),
    FOREIGN KEY (criterionID) REFERENCES GradingCriterion(criterionID)
);

-- Public Announcements
CREATE TABLE IF NOT EXISTS PublicAnnouncement (
    announcementID INTEGER PRIMARY KEY,
    thesisID INTEGER NOT NULL,
    examinationID INTEGER NOT NULL,
    thesisTitle TEXT NOT NULL,
    studentName TEXT NOT NULL,
    supervisorName TEXT NOT NULL,
    presentationDateTime DATETIME NOT NULL,
    locationDetails TEXT NOT NULL,
    FOREIGN KEY (thesisID) REFERENCES Thesis(thesisID),
    FOREIGN KEY (examinationID) REFERENCES Examination(examinationID)
);

-- Create indexes for frequently accessed fields
CREATE INDEX idx_thesis_status ON Thesis(status);
CREATE INDEX idx_thesis_topic_status ON ThesisTopic(status);
CREATE INDEX idx_committee_status ON CommitteeMembership(invitationStatus);
CREATE INDEX idx_examination_datetime ON Examination(examinationDateTime);
