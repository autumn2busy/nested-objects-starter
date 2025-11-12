import csv
import os
from bs4 import BeautifulSoup

def parse_company_data(html_content):
    """
    Parses the HTML content to extract company listings.
    """
    soup = BeautifulSoup(html_content, 'lxml')
    companies_data = []

    # Find the main container for all company listings
    # <ul data-testid="CompaniesRowGroup"...>
    company_list_container = soup.find('ul', attrs={'data-testid': 'CompaniesRowGroup'})

    if not company_list_container:
        print("Could not find the main company list container ('CompaniesRowGroup').")
        return []

    # Find all individual company list items
    # <li class...="css-tsbwmk"...>
    company_items = company_list_container.find_all('li', class_='css-tsbwmk')

    print(f"Found {len(company_items)} company list items.")

    for item in company_items:
        
        # Helper function to find text safely and avoid errors
        # if an element is missing (e.g., no rating)
        def get_safe_text(tag):
            return tag.get_text(strip=True) if tag else 'N/A'

        # Extract data points based on their CSS classes
        name_tag = item.find('div', class_='css-1hm5uzs')
        rating_tag = item.find('span', class_='css-nf04gl')
        reviews_tag = item.find('span', class_='css-nw500d')
        industry_tag = item.find('div', class_='css-4deqgq')
        desc_tag = item.find('p', class_='css-4kqjb8')
        link_tag = item.find('a', class_='css-1y3kqd5') # Link on the company name

        # Get the text or attribute
        name = get_safe_text(name_tag)
        rating = get_safe_text(rating_tag)
        reviews = get_safe_text(reviews_tag)
        industry = get_safe_text(industry_tag)
        description = get_safe_text(desc_tag)
        
        # Get the relative link from the 'href' attribute
        link = link_tag['href'] if link_tag and link_tag.has_attr('href') else 'N/A'

        # Add all found data to our list
        companies_data.append({
            'Name': name,
            'Rating': rating,
            'Review_Count': reviews,
            'Industry': industry,
            'Description': description,
            'Relative_Link': link
        })
    
    return companies_data

def save_to_csv(data, filename='company_listings.csv'):
    """
    Saves the extracted data to a CSV file.
    Appends data if the file already exists, otherwise creates a new file.
    """
    if not data:
        print("No data to save.")
        return

    # Get headers from the first dictionary's keys
    headers = data[0].keys()
    
    # Check if the file already exists to avoid writing duplicate headers
    file_exists = os.path.isfile(filename)

    try:
        # Open the file in 'a' (append) mode
        with open(filename, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            
            # If the file is new, write the header row
            if not file_exists:
                writer.writeheader()
                
            # Write the new data rows
            writer.writerows(data)
        
        print(f"---")
        if file_exists:
            print(f"✅ Success! Appended {len(data)} companies to {filename}")
        else:
            print(f"✅ Success! Created {filename} and saved {len(data)} companies.")
            
    except Exception as e:
        print(f"An error occurred while saving to CSV: {e}")

def main():
    """
    Main function to read the file, parse it, and save the results.
    """
    html_file_path = 'vehicleinspector.html' # The file you provided

    try:
        with open(html_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: The file '{html_file_path}' was not found.")
        print("Please make sure it's in the same directory as this script.")
        return
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return
    
    extracted_data = parse_company_data(content)
    
    if extracted_data:
        save_to_csv(extracted_data)

if __name__ == "__main__":
    main()