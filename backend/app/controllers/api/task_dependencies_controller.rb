# frozen_string_literal: true

module Api
  # タスク依存関係の管理（工程表用）
  class TaskDependenciesController < ApplicationController
    before_action :require_login

    # POST /api/task_dependencies
    # 依存関係を作成（タスクAの後にタスクB）
    def create
      predecessor = current_user.tasks.find(params[:predecessor_id])
      successor = current_user.tasks.find(params[:successor_id])

      dependency = TaskDependency.new(
        predecessor: predecessor,
        successor: successor
      )

      if dependency.save
        render json: {
          id: dependency.id,
          predecessor_id: dependency.predecessor_id,
          successor_id: dependency.successor_id
        }, status: :created
      else
        render json: { errors: dependency.errors.full_messages }, status: :unprocessable_entity
      end
    end

    # DELETE /api/task_dependencies/:id
    # 依存関係を削除
    def destroy
      dependency = TaskDependency.find(params[:id])

      # 依存関係の両端のタスクが現在のユーザーのものか確認
      unless current_user.tasks.exists?(id: [dependency.predecessor_id, dependency.successor_id])
        render json: { error: "権限がありません" }, status: :forbidden
        return
      end

      dependency.destroy!
      head :no_content
    end

    # GET /api/task_dependencies
    # ユーザーのタスクに関連する依存関係の一覧
    def index
      task_ids = current_user.tasks.pluck(:id)
      dependencies = TaskDependency
                     .where(predecessor_id: task_ids)
                     .or(TaskDependency.where(successor_id: task_ids))

      render json: dependencies.map { |d|
        {
          id: d.id,
          predecessor_id: d.predecessor_id,
          successor_id: d.successor_id
        }
      }
    end
  end
end
