#!/bin/bash
sqlite3 thesis.sqlite ".dump" > output.sql
