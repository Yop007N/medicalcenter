
import unittest
import json
from app import create_app, db
from app.models.user import User

class VulnerabilityTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app('test')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_unauthorized_user_deletion(self):
        # 1. Create a victim user
        victim = User(
            email='victim@example.com',
            first_name='Victim',
            last_name='User',
            role='patient'
        )
        victim.set_password('password123')
        db.session.add(victim)
        db.session.commit()
        victim_id = victim.id

        # 2. Create an attacker user
        attacker = User(
            email='attacker@example.com',
            first_name='Attacker',
            last_name='User',
            role='patient'
        )
        attacker.set_password('password123')
        db.session.add(attacker)
        db.session.commit()

        # 3. Login as attacker
        login_resp = self.client.post('/api/auth/login', json={
            'email': 'attacker@example.com',
            'password': 'password123'
        })
        self.assertEqual(login_resp.status_code, 200)
        access_token = login_resp.json['access_token']

        # 4. Attacker tries to delete victim
        delete_resp = self.client.delete(
            f'/api/users/{victim_id}',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        # 5. Check if deletion was BLOCKED (Vulnerability fixed)
        print(f"Delete response status: {delete_resp.status_code}")

        self.assertEqual(delete_resp.status_code, 403, "The deletion should be forbidden (403)")

        # Verify victim still exists
        deleted_victim = User.query.get(victim_id)
        self.assertIsNotNone(deleted_victim, "Victim should NOT be deleted")

if __name__ == '__main__':
    unittest.main()
