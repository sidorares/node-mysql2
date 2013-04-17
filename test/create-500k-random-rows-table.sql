-- from http://sixarm.com/about/mysql-create-random-data-text-strings.html

drop table if exists foos;
drop procedure if exists randomizer;

CREATE TABLE foos (
    id int(11) NOT NULL AUTO_INCREMENT,
    name char(20),
    PRIMARY KEY (id)
  );

delimiter $$
create procedure randomizer()
    begin
      declare i int Default 0 ;
      declare random char(20);
      myloop: loop
      set random=conv(floor(rand() * 99999999999999), 20, 36) ;
      insert into `foos` (`id`, `name`) VALUES (i+1,random) ;
      set i=i+1;
      if i=500000 then
        leave myloop;
  end if;
    end loop myloop;
  end $$
delimiter ;

call randomizer;

