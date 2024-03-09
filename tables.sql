CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL
);

CREATE TABLE Shelter (
    shelter_id INT AUTO_INCREMENT PRIMARY KEY,
    shelter_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    postal_code VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL
);


CREATE TABLE Pet ( 
    pet_id INT AUTO_INCREMENT PRIMARY KEY,
    pet_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    description TEXT DEFAULT NULL,
    special_care_required TEXT DEFAULT NULL,
    shelter_id INT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    gender ENUM('male', 'female'),
    FOREIGN KEY (shelter_id) REFERENCES Shelter(shelter_id) ON DELETE CASCADE
);


CREATE TABLE Breed (
    pet_id INT NOT NULL PRIMARY KEY,
    type ENUM('cat', 'dog', 'other') NOT NULL,
    breed VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    size VARCHAR(255) NOT NULL,
    avg_life_span VARCHAR(255) NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE
);

CREATE TABLE PetImage (
    pet_id INT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    PRIMARY  KEY (pet_id, image_name),
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE 
);

CREATE TABLE AdoptionRequest (
    pet_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'adopted') DEFAULT 'pending' NOT NULL,
    residence_type VARCHAR(255) NOT NULL,
    pet_for VARCHAR(255) NOT NULL,
    reason_for_adoption TEXT NOT NULL,
    care_plan TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (pet_id, user_id),
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE AdoptionHistory (
    pet_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (pet_id, user_id),
    adoption_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (pet_id) REFERENCES Pet(pet_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);


/* TRIGGERS */
DELIMITER //
/* Data Validation Trigger: This trigger will prevent a user from adopting a pet that is not available. */
/* CREATE TRIGGER before_adoption_insert BEFORE INSERT ON AdoptionHistory
FOR EACH ROW
BEGIN
    DECLARE pet_available BOOLEAN;
    SELECT is_available INTO pet_available FROM Pet WHERE pet_id = NEW.pet_id;
    IF pet_available = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This pet is not available for adoption.';
    END IF;
END // */

/* Update Pet Status Trigger: This trigger will update the is_available status of a pet in the Pet table to FALSE when a new adoption record is inserted into the AdoptionHistory table. */
CREATE TRIGGER after_adoption_insert AFTER INSERT ON AdoptionHistory
FOR EACH ROW
BEGIN
    UPDATE Pet SET is_available = FALSE WHERE pet_id = NEW.pet_id;
END //
DELIMITER ;



CREATE VIEW AvailablePets AS
SELECT 
    Pet.pet_id,
    Pet.pet_name,
    Pet.age,
    Pet.special_care_required,
    Pet.description,
    Breed.type AS pet_type,
    Breed.breed,
    Breed.description AS breed_description,
    Breed.size,
    Breed.avg_life_span,
    GROUP_CONCAT(PetImage.image_name) AS images,
    Shelter.shelter_name,
    Shelter.city,
    Shelter.shelter_id,
    Pet.gender
FROM Pet
JOIN Breed ON Pet.pet_id = Breed.pet_id
JOIN PetImage ON Pet.pet_id = PetImage.pet_id
JOIN Shelter ON Pet.shelter_id = Shelter.shelter_id
WHERE Pet.is_available = TRUE
GROUP BY Pet.pet_id;


-- View of all users who have made an adoption request
CREATE VIEW UsersWithAdoptionRequest AS
SELECT User.user_id, User.first_name, User.last_name, User.username, User.email, AdoptionRequest.status
FROM User
JOIN AdoptionRequest ON User.user_id = AdoptionRequest.user_id;

-- View of all pets with their breed information
CREATE VIEW PetsWithBreed AS
SELECT Pet.pet_id, Pet.pet_name, Pet.age, Pet.special_care_required, Breed.type, Breed.breed, Breed.description, Breed.size, Breed.avg_life_span
FROM Pet
JOIN Breed ON Pet.pet_id = Breed.pet_id;


/* PROCEDURES */

/* Add New Pet Procedure: This procedure will insert a new pet into the Pet table. */
DELIMITER //

CREATE PROCEDURE AddNewPet(
    IN p_pet_name VARCHAR(255), 
    IN p_age INT, 
    IN p_special_care_required TEXT, 
    IN p_shelter_id INT,
    IN p_type ENUM('cat', 'dog', 'other'),
    IN p_breed VARCHAR(255),
    IN p_description TEXT,
    IN breed_description TEXT,
    IN p_size VARCHAR(255),
    IN p_avg_life_span VARCHAR(255),
    IN p_gender ENUM('male', 'female'),
    OUT p_pet_id INT
)
BEGIN
    INSERT INTO Pet (pet_name, age, description, special_care_required, shelter_id, gender)
    VALUES (p_pet_name, p_age, p_description, p_special_care_required, p_shelter_id, p_gender);
    
    SET p_pet_id = LAST_INSERT_ID();
    
    INSERT INTO Breed (pet_id, type, breed, description, size, avg_life_span)
    VALUES (p_pet_id, p_type, p_breed, breed_description, p_size, p_avg_life_span);
END //




/* Adopt Pet Procedure: This procedure will insert a new record into the AdoptionHistory table */
CREATE PROCEDURE AdoptPet(IN p_pet_id INT, IN p_user_id INT)
BEGIN
    INSERT INTO AdoptionHistory (pet_id, user_id)
    VALUES (p_pet_id, p_user_id);
END //

/* Get Available Pets Procedure: This procedure will return all pets that are currently available for adoption. */
CREATE PROCEDURE GetAvailablePets()
BEGIN
    SELECT * FROM Pet WHERE is_available = TRUE;
END //


/* Create Adoption Request: This procedure creates a new adoption request with a status of ‘pending’. */
CREATE PROCEDURE CreateAdoptionRequest(IN p_pet_id INT, IN p_user_id INT, IN p_residence_type VARCHAR(255), IN p_pet_for VARCHAR(255), IN p_reason_for_adoption TEXT, IN p_care_plan TEXT)
BEGIN
    INSERT INTO AdoptionRequest (pet_id, user_id, status, residence_type, pet_for, reason_for_adoption, care_plan)
    VALUES (p_pet_id, p_user_id, 'pending', p_residence_type, p_pet_for, p_reason_for_adoption, p_care_plan);
END //


/* Update Adoption Request Status: This procedure updates the status of an existing adoption request */
CREATE PROCEDURE UpdateAdoptionRequestStatus(IN p_pet_id INT, IN p_user_id INT, IN p_status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'adopted'))
BEGIN
    UPDATE AdoptionRequest
    SET status = p_status
    WHERE pet_id = p_pet_id AND user_id = p_user_id;
END //


/* Finalize Adoption: This procedure changes the status of an adoption request to ‘adopted’ and adds a record to the AdoptionHistory table. */
CREATE PROCEDURE FinalizeAdoption(IN p_pet_id INT, IN p_user_id INT)
BEGIN
    CALL UpdateAdoptionRequestStatus(p_pet_id, p_user_id, 'adopted');
    INSERT INTO AdoptionHistory (pet_id, user_id)
    VALUES (p_pet_id, p_user_id);
END //



/* Approve Adoption Request: This procedure approves an adoption request and sets the pet as not available for adoption. */
CREATE PROCEDURE ApproveAdoptionRequest(IN p_pet_id INT, IN p_user_id INT)
BEGIN
    UPDATE AdoptionRequest
    SET status = 'accepted'
    WHERE pet_id = p_pet_id AND user_id = p_user_id;

    UPDATE Pet
    SET is_available = FALSE
    WHERE pet_id = p_pet_id;
END //


/* Cancel Adoption Request: This procedure cancels an adoption request and sets the pet as available for adoption. */
CREATE PROCEDURE CancelAdoptionRequest(IN p_pet_id INT, IN p_user_id INT)
BEGIN
    UPDATE AdoptionRequest
    SET status = 'cancelled'
    WHERE pet_id = p_pet_id AND user_id = p_user_id;

    UPDATE Pet
    SET is_available = TRUE
    WHERE pet_id = p_pet_id;
END //


DELIMITER ;



/* DATA INSERTION


-- Inserting data into the User table
INSERT INTO User (first_name, last_name, username, email, password_hash, salt)
VALUES ('John', 'Doe', 'johndoe', 'john.doe@example.com', 'hashed_password1',"salt1"),
       ('Jane', 'Doe', 'janedoe', 'jane.doe@example.com', 'hashed_password2', "salt2");

-- Inserting data into the Shelter table
INSERT INTO Shelter (shelter_name, username, email, password_hash,salt, street, city, state, postal_code, country, phone)
VALUES ('Happy Pets', 'happypets', 'happypets@example.com', 'hashed_password3','salt3', '1234 Pet Street', 'Pet City', 'Pet State', '12345', 'Pet Country', '123-456-7890');

-- Inserting data into the Pet table
INSERT INTO Pet (pet_name, age, special_care_required, shelter_id)
VALUES ('Tommy', 2, 'Requires special diet', 1),
       ('Lucy', 3, 'No special care required', 1);

-- Inserting data into the Breed table
INSERT INTO Breed (pet_id, type, breed, description, size, avg_life_span)
VALUES (1, 'dog', 'Labrador', 'Friendly and outgoing', 'Medium', '10-12 years'),
       (2, 'cat', 'Persian', 'Quiet and sweet', 'Small', '10-15 years');

-- Inserting data into the PetImage table
INSERT INTO PetImage (pet_id, image_name)
VALUES (1, 'image_url1'),
       (2, 'image_url2');

-- Inserting data into the AdoptionRequest table
INSERT INTO AdoptionRequest (pet_id, user_id, status, residence_type, pet_for, reason_for_adoption, care_plan)
VALUES (1, 1, 'pending', 'House', 'Companion', 'Looking for a friendly pet', 'Will provide regular meals and walks');

-- Inserting data into the AdoptionHistory table
-- Note: This is just a sample. In a real-world scenario, data in this table would be inserted when an adoption is finalized.
INSERT INTO AdoptionHistory (pet_id, user_id)
VALUES (2, 2); */
