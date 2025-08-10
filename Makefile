NAME = pnj_generator
SRC	= main.py

# Colors
GREEN = /bin/echo -e "\x1b[32m $1\x1b[0m"
RED = /bin/echo -e "\x1b[31m $1\x1b[0m"
# GREEN=\033[0;32m
# RED=\033[0;31m
# YELLOW=\033[0;33m
# BLUE=\033[0;34m
# CYAN=\033[0;36m
# WHITE=\033[0m

## -- Init project --
all: ## Initialise le projet
	$(MAKE) $(NAME)

$(NAME): ## Creer l'executable python
	cp $(SRC) $(NAME)
	@ $(call GREEN, "Created $(NAME)")
	chmod 777 $(NAME)
	@ $(call GREEN, "Changed permissions")

run: ## Lance le serveur pour voir le site
	@ $(call GREEN, "Lancemant du serveur")
	@ $(call GREEN, "http://localhost:8000/home.html")
	python -m http.server
	@ $(call GREEN, "Fermeture du serveur")

convert: ## Convertir YAML en JSON
	@ $(call GREEN, "Conversion du fichier questions.yaml en questions.json")
	python converti.py
	@ $(call GREEN, "Conversion reussit")

clean: ## Supprime le fichier __pycache__
	rm -f */__pycache__/*
	rmdir */__pycache__
	rm -f */*/__pycache__/*
	rmdir */*/__pycache__
	@ $(call GREEN, "Deleted __pycache__")

fclean: ## Supprime l'executable
	rm -f $(NAME)
	@ $(call GREEN, "Deleted $(NAME)")

re:	## Nettoie et Créer un nouvelle executable
	$(MAKE) fclean
	$(MAKE) $(NAME)

## -- 🛠️ Others --
help: ## List of commands
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'