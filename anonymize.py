import json
import random
import re
from pathlib import Path

# Set seed for reproducibility
random.seed(42)

def generate_synthetic_hostname(index):
    """Generate a synthetic hostname"""
    server_types = ["app", "web", "api", "mail", "db", "cache", "proxy"]
    environments = ["prod", "stage", "test", "dev"]
    server_type = server_types[index % len(server_types)]
    env = environments[(index // len(server_types)) % len(environments)]
    return f"{server_type}-{env}-{index:03d}.example.com"

def generate_synthetic_ip():
    """Generate a synthetic IP address"""
    # Using private IP ranges and some public-looking IPs
    choice = random.randint(0, 2)
    if choice == 0:  # Private 10.x.x.x
        return f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    elif choice == 1:  # Private 172.16.x.x to 172.31.x.x
        return f"172.{random.randint(16, 31)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
    else:  # Public-looking IPs
        return f"{random.randint(40, 220)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

def generate_synthetic_subject(hostname, index):
    """Generate a synthetic certificate subject"""
    domain = hostname.split('.')[0]  # Get base name
    subjects = [
        f"CN={hostname}, O=\"Example Corp\", L=New York, S=New York, C=US",
        f"CN={hostname}, O=\"Tech Solutions Inc\", L=San Francisco, S=California, C=US",
        f"CN={hostname}, O=\"Global Systems Ltd\", L=London, S=England, C=GB",
        f"CN={hostname}, O=\"Digital Services\", L=Toronto, S=Ontario, C=CA",
        f"E=admin@example.com, CN={hostname}, OU=IT, O=\"Enterprise Inc\", L=Seattle, S=Washington, C=US",
    ]
    return subjects[index % len(subjects)]

def generate_synthetic_san_names(hostname, count=None):
    """Generate synthetic Subject Alternative Names"""
    base_domain = ".".join(hostname.split(".")[-2:])  # Get example.com
    server_name = hostname.split(".")[0]  # Get server-prod-001
    
    if count is None:
        count = random.randint(1, 6)
    
    san_names = [hostname]  # Always include the main hostname
    
    # Generate related SANs
    prefixes = ["app", "web", "api", "mail", "admin", "secure", "staging", "backup", "cache", "sync"]
    
    for i in range(count - 1):
        prefix = prefixes[i % len(prefixes)]
        san_names.append(f"{prefix}-{server_name}.{base_domain}")
    
    return san_names

def anonymize_certificate_data(input_file, output_file):
    """Anonymize the certificate inventory JSON file"""
    
    # Read the JSON file
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Create a mapping for consistent anonymization
    hostname_mapping = {}
    ip_mapping = {}
    used_ips = set()
    
    # Process each certificate entry
    for index, cert in enumerate(data['Data']):
        original_hostname = cert['HostName']
        original_ip = cert['IPAddress']
        
        # Generate or retrieve synthetic hostname
        if original_hostname not in hostname_mapping:
            hostname_mapping[original_hostname] = generate_synthetic_hostname(index)
        
        # Generate or retrieve synthetic IP
        if original_ip not in ip_mapping:
            # Ensure unique IPs
            while True:
                new_ip = generate_synthetic_ip()
                if new_ip not in used_ips:
                    ip_mapping[original_ip] = new_ip
                    used_ips.add(new_ip)
                    break
        
        synthetic_hostname = hostname_mapping[original_hostname]
        synthetic_ip = ip_mapping[original_ip]
        
        # Replace HostName
        cert['HostName'] = synthetic_hostname
        
        # Replace IPAddress
        cert['IPAddress'] = synthetic_ip
        
        # Replace Subject
        cert['Subject'] = generate_synthetic_subject(synthetic_hostname, index)
        
        # Replace SubjectAlternativeNames
        san_count = len(cert.get('SubjectAlternativeNames', []))
        cert['SubjectAlternativeNames'] = generate_synthetic_san_names(synthetic_hostname, san_count)
        
        print(f"Processed {index + 1}/731 certificates", end='\r')
    
    print("\n")
    
    # Write the anonymized data to output file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Anonymization complete! Output written to: {output_file}")

if __name__ == "__main__":
    input_file = r"c:\repos\joey-clm-inventory\data\cetificate-inventory.json"
    output_file = r"c:\repos\joey-clm-inventory\data\cetificate-inventory-anonymized.json"
    
    anonymize_certificate_data(input_file, output_file)
