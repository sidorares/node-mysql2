-- from http://sixarm.com/about/mysql-create-random-data-text-strings.html

drop table if exists ints;
drop procedure if exists randomize_nums;

CREATE TABLE ints (
    id int(11) NOT NULL AUTO_INCREMENT,
    val1 int(11),
    val2 double,
    PRIMARY KEY (id)
  );

delimiter $$
create procedure randomize_nums()
    begin
      declare i int Default 0 ;
      declare random int(20);
      declare random1 double;
      myloop: loop
      set random=floor(rand() * 99999);
      set random1=rand() * 99999 ;
      insert into ints VALUES (i+1,random, random1) ;
      set i=i+1;
      if i=500000 then
        leave myloop;
  end if;
    end loop myloop;
  end $$
delimiter ;

call randomize_nums;

