CREATE TABLE IF NOT EXISTS school_library_condition (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `Periode` INT NOT NULL,
    `Wilayah` VARCHAR(100) NOT NULL,
    `Kode Wilayah` VARCHAR(20) NOT NULL,
    `Kota/Kab` VARCHAR(100) NOT NULL,
    `Kode Kota/Kab` VARCHAR(20) NOT NULL,
    `Status Sekolah` VARCHAR(30) NOT NULL,
    `Baik` INT NOT NULL,
    `Rusak Ringan` INT NOT NULL,
    `Rusak Sedang` INT NOT NULL,
    `Rusak Berat` INT NOT NULL,
    `Total Rusak` INT NOT NULL,
    `Jumlah` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

LOAD DATA INFILE '/var/lib/mysql-files/dataset.csv'
INTO TABLE school_library_condition
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
(
    `Periode`,
    `Wilayah`,
    `Kode Wilayah`,
    `Kota/Kab`,
    `Kode Kota/Kab`,
    `Status Sekolah`,
    `Baik`,
    `Rusak Ringan`,
    `Rusak Sedang`,
    `Rusak Berat`,
    `Total Rusak`,
    `Jumlah`
);
