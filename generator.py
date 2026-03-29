import json
import secrets

def generate_eth_address():
    
    return "0x" + secrets.token_hex(20)

def create_database(count, filename, my_address):
    addresses = []
    
    addresses.append(my_address.lower())
    
    for _ in range(count - 1):
        addresses.append(generate_eth_address())
        
    addresses.sort()
    
    data = {
        "metadata": {
            "description": f"Whitelist database for {count} verified users",
            "count": len(addresses)
        },
        "addresses": addresses
    }
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"Utworzono plik {filename} z {len(addresses)} adresami.")


MY_WALLET = "0x9569CD10059F2B1561dcaf188E3476F5b85A5afA"


create_database(100, "db_small_100.json", MY_WALLET)
create_database(1000, "db_medium_1000.json", MY_WALLET)
create_database(10000, "db_large_10000.json", MY_WALLET)