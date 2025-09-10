#!/bin/bash
sql2dbml schemas.sql  > schemas.dbml
dbml-renderer -i schemas.dbml -o erd.svg
inkscape -w 4096 -h 4096 erd.svg -o erd.png
