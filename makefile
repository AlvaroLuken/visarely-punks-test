include .env
export $(shell sed 's/=.*//' .env)

.PHONY: deploy_visarely check_visarely

deploy_visarely:
	@echo "Deploying Visarely contracts"
	@forge script script/Deploy.s.sol:DeployVisarelyContracts --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify -vvvvv --legacy --via-ir
	@echo "Deployment completed!"

check_visarely:
	@echo "Checking Visarely contracts deployment"
	@forge script script/Deploy.s.sol:DeployVisarelyContracts --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) -vvvv --via-ir
	@echo "Check completed!"
