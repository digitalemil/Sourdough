	
	create database if not exists ${MAINTABLE}db;
	
	use ${MAINTABLE}db;

	drop view if exists ${MAINTABLE}With${SECONDTABLE};
	drop view if exists ${SECONDTABLE}For${MAINTABLE};
	drop view if exists Local${MAINTABLE};

	drop table if exists ${SECONDTABLE};
	
	drop table if exists UserDetails Cascade;
	Create Table if not exists UserDetails  (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		name STRING NOT NULL,
		email STRING NOT NULL,
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

	Create Table if not exists ${MAINTABLE} ( 
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdon TIMESTAMP,
		createdby UUID NOT NULL REFERENCES UserDetails (id) ON DELETE CASCADE,
		xml STRING NOT NULL UNIQUE,
		json JSONB NOT NULL,
		name string as (json->>'name') virtual,
		origin STRING NOT NULL,
		CONSTRAINT "primary" PRIMARY KEY (id),
		family f1 (id, createdon, origin, json),
		family f2 (xml)
	);
	
	create table if not exists ${SECONDTABLE} (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
		createdby UUID NOT NULL REFERENCES UserDetails (id),
		${MAINTABLE}id UUID NOT NULL REFERENCES ${MAINTABLE} (id) ON DELETE no ACTION,
		createdon TIMESTAMP,
		${STARS} int NOT NULL,
		 CONSTRAINT "primary" PRIMARY KEY (id)
	);
	
	
	create view ${SECONDTABLE}For${MAINTABLE} as select ${MAINTABLE}id, count(id) as n, AVG(${STARS}) as a from ${SECONDTABLE} group by ${MAINTABLE}id; 
	create view ${MAINTABLE}With${SECONDTABLE} as select * from ${MAINTABLE} f right join ${SECONDTABLE}For${MAINTABLE} r on r.${MAINTABLE}id=f.id;
	
	-- cockroach demo --log-dir ~/tmp/lesfleurs/cockroachdb-logs  --nodes 9 --no-example-database --insecure --demo-locality=region=gcp-europe-west4,az=gcp-europe-west4a:region=gcp-europe-west4,az=gcp-europe-west4b:region=gcp-europe-west4,az=gcp-europe-west4c:region=azure-singapore,az=azure-singapore1:region=azure-singapore,az=azure-singapore2:region=azure-singapore,az=azure-singapore3:region=onprem-us,az=onprem-us-rack1:region=onprem-us,az=onprem-us-rack2:region=onprem-us,az=onprem-us-rack3

	ALTER DATABASE ${MAINTABLE}db SET PRIMARY REGION='gcp-europe-west4'; 
	ALTER DATABASE ${MAINTABLE}db ADD REGION 'onprem-us'; 
	ALTER DATABASE ${MAINTABLE}db ADD REGION 'azure-singapore';

	ALTER TABLE ${MAINTABLE} ADD Column crdb_region crdb_internal_region AS  (
		CASE 
			WHEN origin='EMEA' THEN 'gcp-europe-west4'
			WHEN origin='AMERICAS' THEN 'onprem-us'
			WHEN origin='APAC' THEN 'azure-singapore'
			ELSE 'gcp-europe-west4'
		end
	) STORED;

	ALTER TABLE ${MAINTABLE} ALTER COLUMN crdb_region SET NOT NULL;
	ALTER TABLE ${MAINTABLE} SET LOCALITY REGIONAL BY ROW;
	SET override_multi_region_zone_config = true;
	ALTER TABLE ${MAINTABLE} CONFIGURE ZONE USING num_replicas = 3; 

	create view Local${MAINTABLE} as 
		select f.* from ${MAINTABLE} f Join UserDetails db On (f.origin=db.location) where db.name= current_user; 
	
	GRANT SELECT on Local${MAINTABLE} to Joe;
	GRANT SELECT on Local${MAINTABLE} to Dude;
	GRANT SELECT on Local${MAINTABLE} to Fleur;
		
-- explain analyze select id from ${MAINTABLE} where crdb_region='gcp-europe-west4';
-- select id,origin from ${MAINTABLE};
-- explain analyze select origin from ${MAINTABLE} where id='';

