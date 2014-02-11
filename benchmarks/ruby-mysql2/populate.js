var common     = require('../../test/common');
var connection = common.createConnection();
var assert     = require('assert');
var Faker      = require('charlatan');
var fs = require('fs');

var createSql = fs.readFileSync('./schema.sql').toString();

// use seed to make it consistent between runs
// copy-paste from http://stackoverflow.com/questions/521295/javascript-random-seeds

var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;

// Takes any integer
function seed(i) {
    m_w = i;
}

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function rand()
{
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + m_w) & mask;
    result /= 4294967296;
    return result + 0.5;
}

seed(123);

connection.query(createSql);
connection.query("DELETE FROM mysql2_test");

function insertRow(r) {
  connection.query("INSERT INTO mysql2_test SET ? ", r);
}

var num_rows = 10000;

var five_words, twenty5_paragraphs;
for (var i = 0; i < num_rows; ++i)
{
  five_words = Faker.Lorem.words(1 + rand(4)).join(' ').slice(0, 10);
  twenty5_paragraphs = Faker.Lorem.paragraphs(1 + rand(24)).join(' ');
  insertRow({
     bit_test: 1,
     tiny_int_test: rand(128),
     small_int_test: rand(32767),
     medium_int_test: rand(8388607),
     int_test: rand(2147483647),
     big_int_test: rand(9223372036854775807),
     float_test: rand(32767)/1.87,
     float_zero_test: 0.0,
     double_test: rand(8388607)/1.87,
     decimal_test: rand(8388607)/1.87,
     decimal_zero_test: 0,
     date_test: '2010-4-4',
     date_time_test: '2010-4-4 11:44:00',
     timestamp_test: '2010-4-4 11:44:00',
     time_test: '11:44:00',
     year_test: 14,
     char_test: five_words,
     varchar_test: five_words,
     binary_test: five_words,
     varbinary_test: five_words,
     tiny_blob_test: five_words,
     tiny_text_test: Faker.Lorem.paragraph(rand(5)),
     blob_test: twenty5_paragraphs,
     text_test: twenty5_paragraphs,
     medium_blob_test: twenty5_paragraphs,
     medium_text_test: twenty5_paragraphs,
     long_blob_test: twenty5_paragraphs,
     long_text_test: twenty5_paragraphs,
     enum_test: ['val1', 'val2'][rand(2)],
     set_test: ['val1', 'val2', 'val1,val2'][rand(3)]
  });
}

connection.end();
