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


DELIMITER ;
