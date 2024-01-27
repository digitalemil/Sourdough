	
	create database if not exists ticketsdb;
	
	use ticketsdb;

	drop view if exists TicketsWithPriorities;
	drop view if exists PrioritiesForTickets;
	drop view if exists LocalTickets;

	drop table if exists Priorities;
	
	drop table if exists UserDetails Cascade;
	Create Table if not exists UserDetails  (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		name STRING NOT NULL UNIQUE,
		email STRING NOT NULL UNIQUE,
		password_hash STRING NOT NULL,
		location STRING NOT NULL,
		CONSTRAINT "primary" PRIMARY KEY (id)
	);
	Upsert Into UserDetails (name, location, email, password_hash) Values ('joe', 'AMERICAS', 'joe@digitalemil.de', '3506511');
	Upsert Into UserDetails (name, location, email, password_hash) Values ('dude', 'APAC', 'dude@digitalemil.de', '3506511');
	Upsert Into UserDetails (name, location, email, password_hash) Values ('fleur', 'EMEA', 'fleur@digitalemil.de', '3506511');
			
	CREATE USER if not exists joe;
	CREATE USER if not exists dude;
	CREATE USER if not exists fleur;
	
	GRANT SELECT on UserDetails to Public;

	Create Table if not exists Tickets ( 
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdon TIMESTAMP,
		createdby UUID NOT NULL REFERENCES UserDetails (id) ON DELETE CASCADE,
		xml STRING NOT NULL,
		json JSONB NOT NULL,
		name string as (json->>'name') virtual,
		origin STRING NOT NULL,
		CONSTRAINT "primary" PRIMARY KEY (id),
		family f1 (id, createdon, createdby, origin, json),
		family f2 (xml)
	);
	
	create table if not exists Priorities (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdby UUID NOT NULL REFERENCES UserDetails (id),
		Ticketsid UUID NOT NULL REFERENCES Tickets (id) ON DELETE no ACTION,
		createdon TIMESTAMP,
		Priority int NOT NULL,
		 CONSTRAINT "primary" PRIMARY KEY (id)
	);
	
	
	create view PrioritiesForTickets as select Ticketsid, count(id) as n, AVG(Priority) as a from Priorities group by Ticketsid; 
	create view TicketsWithPriorities as select * from Tickets f right join PrioritiesForTickets r on r.Ticketsid=f.id;
	
	-- cockroach demo --log-dir ~/tmp/lesfleurs/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=gcp-europe-west4,az=gcp-europe-west4a:region=gcp-europe-west4,az=gcp-europe-west4b:region=gcp-europe-west4,az=gcp-europe-west4c:region=azure-singapore,az=azure-singapore1:region=azure-singapore,az=azure-singapore2:region=azure-singapore,az=azure-singapore3:region=onprem-us,az=onprem-us-rack1:region=onprem-us,az=onprem-us-rack2:region=onprem-us,az=onprem-us-rack3

	ALTER DATABASE Ticketsdb SET PRIMARY REGION='emea'; 
	ALTER DATABASE Ticketsdb ADD REGION 'americas'; 
	ALTER DATABASE Ticketsdb ADD REGION 'apac';

	ALTER TABLE Tickets ADD Column crdb_region crdb_internal_region AS  (
		CASE 
			WHEN origin='EMEA' THEN 'emea'
			WHEN origin='AMERICAS' THEN 'americas'
			WHEN origin='APAC' THEN 'apac'
			ELSE 'emea'
		end
	) STORED;

	ALTER TABLE Tickets ALTER COLUMN crdb_region SET NOT NULL;
	ALTER TABLE Tickets SET LOCALITY REGIONAL BY ROW;
	SET override_multi_region_zone_config = true;
--	ALTER TABLE Tickets CONFIGURE ZONE USING num_replicas = 3; 
	ALTER DATABASE ticketsdb CONFIGURE ZONE USING num_replicas = 3;


	create view LocalTickets as 
		select f.* from Tickets f Join UserDetails db On (f.origin=db.location) where db.name= current_user; 
	
		
	GRANT SELECT on LocalTickets to Joe;
	GRANT SELECT on LocalTickets to Dude;
	GRANT SELECT on LocalTickets to Fleur;
		 
	
	drop view if exists TicketsWithPrioritiesGrafana;
	drop view if exists PrioritiesForTicketsGrafana;
	drop view if exists TicketsGrafana;
	drop view if exists PrioritiesGrafana;
	
	create view TicketsGrafana as
		select id, name, origin from Tickets;
	create view PrioritiesGrafana as
		select id, Ticketsid, Priority from Priorities;
	create view PrioritiesForTicketsGrafana as select Ticketsid, count(id) as n, AVG(Priority) as a from Priorities group by Ticketsid; 
	create view TicketsWithPrioritiesGrafana as select * from TicketsGrafana f right join PrioritiesForTickets r on r.Ticketsid=f.id;

	CREATE USER  if not exists grafana;
	GRANT SELECT on TicketsGrafana to Grafana; 
	GRANT SELECT on PrioritiesGrafana to Grafana;
	GRANT SELECT on PrioritiesForTicketsGrafana to Grafana;
	GRANT SELECT on PrioritiesForTicketsGrafana to Grafana;
	GRANT SELECT on TicketsWithPrioritiesGrafana to Grafana;
	ALTER USER grafana WITH PASSWORD 'cr1401';
	
		
-- explain analyze select id from Tickets where crdb_region='gcp-europe-west4';
-- select id,origin from Tickets;
-- explain analyze select origin from Tickets where id='';

