	
	create database if not exists Ticketsdb;
	
	use Ticketsdb;

	drop view if exists TicketsWithStars;
	drop view if exists StarsOfTickets;
	drop view if exists LocalTickets;

	drop table if exists Stars;
	
	drop table if exists UserLocations Cascade;
	Create Table if not exists UserLocations  (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		name STRING NOT NULL,
		location STRING NOT NULL,
		CONSTRAINT "primary" PRIMARY KEY (id)
	);
	Upsert Into UserLocations (name, location) Values ('joe', 'AMERICAS');
	Upsert Into UserLocations (name, location) Values ('dude', 'APAC');
	Upsert Into UserLocations (name, location) Values ('fleur', 'EMEA');
	Upsert Into UserLocations (name, location) Values ('root', 'EMEA');
	Upsert Into UserLocations (name, location) Values ('root', 'APAC');
	Upsert Into UserLocations (name, location) Values ('root', 'AMERICAS');
			
	CREATE USER if not exists joe;
	CREATE USER if not exists dude;
	CREATE USER if not exists fleur;
	
	GRANT SELECT on UserLocations to Public;

	Create Table if not exists Tickets ( 
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdon TIMESTAMP,
		xml STRING NOT NULL UNIQUE,
		json JSONB NOT NULL,
		name string as (json->>'name') virtual,
		origin STRING NOT NULL,
		CONSTRAINT "primary" PRIMARY KEY (id),
		family f1 (id, createdon, origin, name, json),
		family f2 (xml)
	);
	
	create table if not exists Stars (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdby UUID NOT NULL REFERENCES Users (id),
		Ticketsid UUID NOT NULL REFERENCES Tickets (id) ON DELETE no ACTION,
		createdon TIMESTAMP,
		Stars int NOT NULL,
		 CONSTRAINT "primary" PRIMARY KEY (id)
	);
	
	
	create view StarsOfTickets as select Ticketsid, count(id) as n, AVG(Stars) as a from Stars group by Ticketsid; 
	create view TicketsWithStars as select * from Tickets f right join StarsOfTickets r on r.Ticketsid=f.id;
	name, f.createdon, f.id, f.createdon, r.a, r.n from StarsOfTickets r right join Tickets f on r.Ticketsid=f.id order by RANDOM() limit 1; 

	-- cockroach demo --log-dir ~/tmp/lesfleurs/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=gcp-europe-west4,az=gcp-europe-west4a:region=gcp-europe-west4,az=gcp-europe-west4b:region=gcp-europe-west4,az=gcp-europe-west4c:region=azure-singapore,az=azure-singapore1:region=azure-singapore,az=azure-singapore2:region=azure-singapore,az=azure-singapore3:region=onprem-us,az=onprem-us-rack1:region=onprem-us,az=onprem-us-rack2:region=onprem-us,az=onprem-us-rack3

	ALTER DATABASE Ticketsdb SET PRIMARY REGION='gcp-europe-west4'; 
	ALTER DATABASE Ticketsdb ADD REGION 'onprem-us'; 
	ALTER DATABASE Ticketsdb ADD REGION 'azure-singapore';

	ALTER TABLE Tickets ADD Column crdb_region crdb_internal_region AS  (
		CASE 
			WHEN origin='EMEA' THEN 'gcp-europe-west4'
			WHEN origin='AMERICAS' THEN 'onprem-us'
			WHEN origin='APAC' THEN 'azure-singapore'
			ELSE 'gcp-europe-west4'
		end
	) STORED;

	ALTER TABLE Tickets ALTER COLUMN crdb_region SET NOT NULL;
	ALTER TABLE Tickets SET LOCALITY REGIONAL BY ROW;
	SET override_multi_region_zone_config = true;
	ALTER TABLE Tickets CONFIGURE ZONE USING num_replicas = 3; 

	create view LocalTickets as 
		select f.* from Tickets f Join UserLocations db On (f.origin=db.location) where db.name= current_user; 
	
	GRANT SELECT on LocalTickets to Joe;
	GRANT SELECT on LocalTickets to Dude;
	GRANT SELECT on LocalTickets to Fleur;
		
-- explain analyze select id from Tickets where crdb_region='gcp-europe-west4';
-- select id,origin from Tickets;
-- explain analyze select origin from Tickets where id='';

