CREATE DATABASE Flow;

USE Flow;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    auth_id VARCHAR(255) NOT NULL UNIQUE
--     email VARCHAR(255) NOT NULL UNIQUE,
--     passkey VARCHAR(50) NOT NULL
);

CREATE TABLE Contents (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    CONSTRAINT content_fk_user_id FOREIGN KEY (user_id) REFERENCES Users(user_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Contents2Tags (
	content_id INT,
    tag_id INT,
	CONSTRAINT Contents2Tags_fk_content_id FOREIGN KEY (content_id) REFERENCES Contents(content_id),
    CONSTRAINT Contents2Tags_fk_tag_id FOREIGN KEY (tag_id) REFERENCES Tags(tag_id)
);

CREATE TABLE Likes (
	user_id INT,
	content_id INT,
	CONSTRAINT Likes_fk_user_id FOREIGN KEY (user_id) REFERENCES Users(user_id),
	CONSTRAINT Likes_fk_content_id FOREIGN KEY (content_id) REFERENCES Contents(content_id),
    PRIMARY KEY (user_id, content_id)
);

CREATE TABLE UserTagInteraction (
	user_id INT,
    tag_id INT,
	CONSTRAINT UserTagInteraction_fk_user_id FOREIGN KEY (user_id) REFERENCES Users(user_id),
	CONSTRAINT UserTagInteraction_fk_tag_id FOREIGN KEY (tag_id) REFERENCES Tags(tag_id),
    PRIMARY KEY (user_id, tag_id),
    score INT NOT NULL
);

insert into Users(username, auth_id) values ('weijia', 1);
insert into Users(username, auth_id) values ('reb', 2);
DELETE FROM Users where user_id=3;
select * from Users;
select * from Contents;
select * from Tags;
select * from Likes;
insert into Contents(user_id, content) values(1, 'today is sunny!');
insert into Contents(user_id, content) values(1, 'I love cats and dogs!');
insert into Contents(user_id, content) values(2, 'Capybaras are cuteeee!');
insert into Contents(user_id, content) values(1, 'I went to cat coffee shop!');
insert into Tags(tag_name) values('weather');
insert into Tags(tag_name) values('dog');
insert into Tags(tag_name) values('cat');
insert into Tags(tag_name) values('capybara');
insert into Tags(tag_name) values('chill');
insert into Tags(tag_name) values('cute');
insert into Contents2Tags values(1, 1);
insert into Contents2Tags values(2, 2);
insert into Contents2Tags values(2, 3);
insert into Contents2Tags values(3, 4);
insert into Contents2Tags values(3, 5);
insert into Contents2Tags values(3, 6);
insert into Contents2Tags values(4, 3);
insert into Likes values(1, 3);
insert into Likes values(2, 2);
insert into Likes values(2, 3);
insert into Likes values(2, 4);
drop table if exists Likes;
insert into UserTagInteraction values(1, 1, 1);
insert into UserTagInteraction values(1, 3, 1);
insert into UserTagInteraction values(1, 4, 1);
insert into UserTagInteraction values(1, 5, 1);
insert into UserTagInteraction values(1, 6, 1);
insert into UserTagInteraction values(2, 2, 1);
insert into UserTagInteraction values(2, 3, 2);
insert into UserTagInteraction values(2, 4, 1);
insert into UserTagInteraction values(2, 5, 1);
insert into UserTagInteraction values(2, 6, 1);
select * from UserTagInteraction;


SELECT c.content_id, c.content, SUM(uti.score) AS relevance
    FROM Contents c
	JOIN Contents2Tags ct ON c.content_id = ct.content_id
    JOIN Tags t ON ct.tag_id = t.tag_id
    JOIN UserTagInteraction uti ON t.tag_id = uti.tag_id
    WHERE uti.user_id = 2
    GROUP BY c.content_id 
    ORDER BY relevance DESC, c.created_at DESC
    LIMIT 50;

