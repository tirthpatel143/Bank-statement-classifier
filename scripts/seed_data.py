import os
import json
from app.classification.ml_model import MLClassifier

SEED_DATA = [
    ("SWIGGY BANGALORE IN", "Food"),
    ("ZOMATO ORDER MUMBAI", "Food"),
    ("MCDONALDS DRIVE THRU", "Food"),
    ("DOMINOS PIZZA DELIVERY", "Food"),
    ("STARBUCKS COFFEE INDIA", "Food"),
    ("SALARY MONTHLY ACME CORP", "Salary"),
    ("PAYROLL DEPOSIT TECH CORP", "Salary"),
    ("EMPLOYER REMUNERATION JAN 2026", "Salary"),
    ("HPCL PETROL PUMP MUMBAI", "Fuel"),
    ("BPCL DIESEL STATION DELHI", "Fuel"),
    ("IOCL PETROL FILLING STATION", "Fuel"),
    ("SHELL AUTO FUEL BANGALORE", "Fuel"),
    ("ELECTRICITY BILL BESCOM JAN", "Utilities"),
    ("JIO BROADBAND RECHARGE", "Utilities"),
    ("AIRTEL MOBILE BILL PAYMENT", "Utilities"),
    ("GAS BILL ADANI TOTAL GAS", "Utilities"),
    ("AMAZON INDIA SHOPPING", "Shopping"),
    ("FLIPKART INTERNET PVT LTD", "Shopping"),
    ("MYNTRA FASHION STORE", "Shopping"),
    ("UBER RIDE MUMBAI", "Transport"),
    ("OLA CABS TRIP DELHI", "Transport"),
    ("METRO CARD RECHARGE MUMBAI", "Transport"),
    ("IRCTC RAILWAY TICKET BOOKING", "Transport"),
    ("ATM CASH WITHDRAWAL MUMBAI", "Cash Withdrawal"),
    ("ATM WDL HDFC BANK", "Cash Withdrawal"),
    ("HDFC BANK ANNUAL SERVICE CHARGES", "Bank Charges"),
    ("MINIMUM BALANCE PENALTY CHARGE", "Bank Charges"),
    ("HDFC HOME LOAN EMI", "Loan/EMI"),
    ("BAJAJ FINSERV CAR LOAN EMI", "Loan/EMI"),
    ("APOLLO PHARMACY MEDICINES", "Healthcare"),
    ("LIC PREMIUM PAYMENT", "Insurance"),
    ("NETFLIX MONTHLY SUBSCRIPTION", "Entertainment"),
    ("BOOKMYSHOW CINEMA TICKETS", "Entertainment"),
    ("ZERODHA BROKING MUTUAL FUND SIP", "Investment")
]

def seed_training_data():
    descriptions = [item[0] for item in SEED_DATA]
    categories = [item[1] for item in SEED_DATA]
    
    ml = MLClassifier()
    ml.fit(descriptions, categories)
    print(f"Successfully seeded and fitted ML model with {len(SEED_DATA)} transactions.")

if __name__ == "__main__":
    seed_training_data()
