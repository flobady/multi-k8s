docker build -t flobady/multi-client:latest -t flobady/multi-client:$SHA -f ./client/Dockerfile ./client # on veut que le latest soit bien le dernier publié sur le cluster donc on le tag ainsi, et on tag avec le SHA pour avoir des republications quand on republie
docker build -t flobady/multi-server:latest -t flobady/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t flobady/multi-worker:latest -t flobady/multi-worker:$SHA -f ./worker/Dockerfile ./worker
docker push flobady/multi-client:latest
docker push flobady/multi-server:latest
docker push flobady/multi-worker:latest
docker push flobady/multi-client:$SHA
docker push flobady/multi-server:$SHA
docker push flobady/multi-worker:$SHA
kubectl apply -f k8s # gcloud est déjà configuré pour utiliser kubectl (cf before_install)
kubectl set image deployments/server-deployment server=flobady/multi-server:$SHA # le container server doit utiliser l'image flobady/multi-server:$SHA
kubectl set image deployments/client-deployment client=flobady/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=flobady/multi-worker:$SHA
