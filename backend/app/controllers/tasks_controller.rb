class TasksController < ApplicationController
    before_action :authenticate_user!, only: [:create, :update, :destroy]
    before_action :set_task, only: [:show, :update, :destroy]

    def index
      if params[:user_id]
        @tasks = Task.where(user_id: params[:user_id])
      else
        @tasks = Task.all
      end
      render json: @tasks
    end

    def show
      render json: @task
    end

    def create
      @task = Task.new(task_params)
      @task.user = current_user

      if @task.save
        render json: @task, status: :created
      else
        render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @task.update(task_params)
        render json: @task, status: :ok
      else
        render json: { errors: @task.errors.full_messages } ,status: :unprocessable_entity
      end
    end

    def destroy
      @task.destroy
      head :no_content
    end

    private

    def set_task
      @task = Task.find(params[:id])
    rescue ActiveRecord::RecordNotFound
        render json: {errors: ["Task not found"] }, status: :not_found
    end

    def task_params
      params.require(:task).permit(:title, :status, :user_id)
    end
  end