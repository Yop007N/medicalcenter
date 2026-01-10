.PHONY: help install run test clean init-db

help:
	@echo "Medical Services Backend - Makefile Commands"
	@echo "=============================================="
	@echo ""
	@echo "install      - Install dependencies"
	@echo "init-db      - Initialize database and create default users"
	@echo "run          - Run development server"
	@echo "test         - Run tests"
	@echo "test-api     - Run API tests"
	@echo "celery       - Run Celery worker"
	@echo "clean        - Clean Python cache files"
	@echo "lint         - Run code linting"
	@echo "format       - Format code with black"
	@echo ""

install:
	pip install -r requirements/dev.txt

init-db:
	python init_db.py

run:
	python run.py

test:
	pytest --cov=app --cov-report=html

test-api:
	python test_api.py

celery:
	celery -A celery_worker.celery worker --loglevel=info

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type d -name '*.egg-info' -exec rm -rf {} +
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -rf .coverage

lint:
	flake8 app/

format:
	black app/
	isort app/
