import streamlit as st
import database as db

if __name__ == "__main__":
    try:
        db.init_seed_data()
        print("Success!")
    except Exception as e:
        print("Error:", repr(e))
