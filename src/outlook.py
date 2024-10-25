import os
from datetime import datetime, timedelta
import yaml
from msal import ConfidentialClientApplication
import requests
from typing import List, Dict
import logging

class OutlookFetcher:
    def __init__(self, config_path: str = "config/config.yaml"):
        """Initialize the OutlookFetcher with configuration."""
        self.config = self._load_config(config_path)
        self.access_token = None
        self.last_check_time = None
        self._setup_logging()
        
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file."""
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        return config['microsoft']
        
    def _setup_logging(self):
        """Set up logging configuration."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def _get_access_token(self) -> str:
        """Get Microsoft Graph API access token."""
        app = ConfidentialClientApplication(
            client_id=self.config['client_id'],
            client_credential=self.config['client_secret'],
            authority=f"https://login.microsoftonline.com/{self.config['tenant_id']}"
        )

        result = app.acquire_token_silent(
            scopes=["https://graph.microsoft.com/.default"],
            account=None
        )

        if not result:
            result = app.acquire_token_for_client(
                scopes=["https://graph.microsoft.com/.default"]
            )

        if "access_token" in result:
            self.access_token = result["access_token"]
            return self.access_token
        else:
            raise Exception("Failed to acquire token")

    def fetch_unread_emails(self) -> List[Dict]:
        """Fetch unread emails since last check."""
        if not self.access_token:
            self.access_token = self._get_access_token()

        current_time = datetime.utcnow()
        
        # If this is the first run, check emails from the last 30 minutes
        if not self.last_check_time:
            self.last_check_time = current_time - timedelta(minutes=30)

        # Format time for Microsoft Graph API
        filter_time = self.last_check_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        # Build query to get unread emails received after last check
        query = {
            '$filter': f"receivedDateTime ge {filter_time} and isRead eq false",
            '$select': 'id,subject,body,from,receivedDateTime,isRead',
            '$orderby': 'receivedDateTime desc',
            '$top': 50  # Limit results
        }

        response = requests.get(
            'https://graph.microsoft.com/v1.0/me/messages',
            headers=headers,
            params=query
        )

        if response.status_code == 200:
            emails = response.json().get('value', [])
            self.logger.info(f"Fetched {len(emails)} new unread emails")
            self.last_check_time = current_time
            return emails
        else:
            self.logger.error(f"Failed to fetch emails: {response.status_code}")
            raise Exception(f"Failed to fetch emails: {response.text}")

    def mark_as_read(self, email_id: str) -> bool:
        """Mark an email as read."""
        if not self.access_token:
            self.access_token = self._get_access_token()

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        response = requests.patch(
            f'https://graph.microsoft.com/v1.0/me/messages/{email_id}',
            headers=headers,
            json={'isRead': True}
        )

        return response.status_code == 200